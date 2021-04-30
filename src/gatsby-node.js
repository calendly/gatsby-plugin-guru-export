import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

import { defaultOptions, runQuery, validateOptions } from "./internals";

const publicPath = `./public`;

export const onPreBootstrap = validateOptions;

exports.onPostBuild = async ({ graphql }, pluginOptions) => {
  const options = {
    ...defaultOptions,
    ...pluginOptions,
  };

  const baseQuery = await runQuery(graphql, options.query);

  const feedPromises = Object.keys(options.feeds).map(async (feed) => {
    const { query, ...rest } = options.feeds[feed];

    let data;
    if (query) {
      data = await runQuery(graphql, query);
    }

    return {
      query: Object.assign({}, baseQuery, data),
      ...rest,
    };
  });

  const feeds = await Promise.all(feedPromises);

  // Serialize data
  const filePromises = feeds.map(async (feed) => {
    const { serialize, query, output, guruFieldMapping, ...rest } = feed;

    const feedData = serialize({ query });
    const outputPath = path.join(publicPath, output);
    await fs.ensureDir(outputPath);

    for (let i = 0; i < feedData.length; i++) {
      const data = feedData[i];
      const outputData = Object.keys(guruFieldMapping).reduce( (acc, key) => {
        const dataKey = guruFieldMapping[key];
        if(typeof dataKey === 'function') {
          acc[key] = dataKey(data)
        }else {
          acc[key] = data[dataKey];
        }
        return acc;
      }, {})
      const outputBody = outputData.Body;
      delete outputData.Body;

      const outputYaml = yaml.dump(outputData);
      const yamlFile = `card${i}.yaml`
      const yamlOutputFile = path.join(outputPath, yamlFile);
      await fs.writeFile(yamlOutputFile, outputYaml);

      const bodyFile = `card${i}.html`
      const bodyOutputFile = path.join(outputPath, bodyFile);
      await fs.writeFile(bodyOutputFile, outputBody);
    }
  });

  // Write to files
  await Promise.all(filePromises);
};
