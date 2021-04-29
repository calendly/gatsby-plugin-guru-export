# gatsby-plugin-guru-export

Create a Guru export of your Gatsby site.

## Install

`npm install gatsby-plugin-guru-export`

## How to Use

```javascript
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-guru-export`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.edges.map(edge => {
                return Object.assign({}, edge.node.frontmatter, {
                  description: edge.node.excerpt,
                  date: edge.node.frontmatter.date,
                  url: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  guid: site.siteMetadata.siteUrl + edge.node.fields.slug,
                  custom_elements: [{ "content:encoded": edge.node.html }],
                })
              })
            },
            query: `
              {
                allMarkdownRemark(
                  sort: { order: DESC, fields: [frontmatter___date] },
                ) {
                  edges {
                    node {
                      excerpt
                      html
                      fields { slug }
                      frontmatter {
                        title
                        date
                      }
                    }
                  }
                }
              }
            `,
            output: "/guru",
            guruFieldMapping: {
              Title: 'mapping',
              ExternalId: 'mapping2',
              ExternalUrl: (serializeData) => `I'm a function`
            }
          },
        ],
      },
    },
  ],
}
```

Each feed must include `output`, `serialize`, `query`, and `guruFieldMapping`. 


**Inspired by gatsby-plugin-feed**