jest.mock(`fs-extra`)
const fs = require(`fs-extra`)
const path = require(`path`)
const { onPostBuild } = require(`../gatsby-node`)

describe("gatsby-plugin-guru-export", () => {
  describe(`onPostBuild`, () => {
    beforeEach(() => {
      fs.exists = jest.fn().mockResolvedValue(true);
      fs.writeFile = jest.fn().mockResolvedValue();
      fs.mkdirp = jest.fn().mockResolvedValue();
    });

    it(`exports`, async () => {
      fs.writeFile = jest.fn();
      fs.writeFile.mockResolvedValue(true);
      const graphql = jest.fn();
      graphql.mockResolvedValue({
        data: {
          site: {
            siteMetadata: {
              title: `a sample title`,
              description: `a description`,
              siteUrl: `http://dummy.url/`,
            },
          },
          allMarkdownRemark: {
            edges: [
              {
                node: {
                  frontmatter: {
                    id: 1,
                    title: "sample title",
                    description: "sample description",
                    slug: 'sample1'
                  },
                },
              },
              {
                node: {
                  frontmatter: {
                    id: 2,
                    title: "sample title 2",
                    description: "sample description 2",
                    slug: 'sample2'
                  },
                },
              },
            ],
          },
        },
      });
      const customQuery = `
      {
        allMarkdownRemark(
          limit: 1000,
        ) {
          edges {
            node {
              frontmatter {
                id
                title
                description
                slug
              }
            }
          }
        }
      }
    `;
      const options = {
        feeds: [
          {
            output: `/guru`,
            serialize: ({ query: { site, allMarkdownRemark } }) =>
              allMarkdownRemark.edges.map((edge) => {
                return {site: site, ... edge.node.frontmatter};
              }),
            query: customQuery,
            guruFieldMapping: {
              Title: "title",
              ExternalId: "id",
              ExternalUrl: (serializedData) =>
                `${serializedData.site.siteMetadata.siteUrl}${serializedData.slug}`,
            },
          },
        ],
      };
      await onPostBuild({ graphql }, options);

      expect(fs.writeFile).toHaveBeenCalledTimes(2);

      const call0 = fs.writeFile.mock.calls[0];
      const call1 = fs.writeFile.mock.calls[1];

      expect(call0[0]).toEqual(path.join(`public/guru`, `card0.yaml`));
      expect(call0[1]).toMatchSnapshot();

      expect(call1[0]).toEqual(path.join(`public/guru`, `card1.yaml`));
      expect(call1[1]).toMatchSnapshot();
    });
  });
});
