const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = process.env.PORT || 3000;

let blogData; // To store fetched blog data

// Function to fetch blog data (memoized)
const memoizedFetchBlogData = _.memoize(async () => {
  const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
    headers: {
      'x-hasura-access-key': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
    }
  });
  return response.data;
});

// Middleware to fetch blog data and calculate statistics (using memoized function)
app.get('/api/blog-stats', async (req, res) => {
  try {
    if (!blogData) {
      blogData = await memoizedFetchBlogData();
    }
    console.log(blogData);
    // Calculate statistics
    const totalBlogs = blogData.length;
    const longestBlog = _.maxBy(blogData, 'title.length');
    const privacyBlogs = _.filter(blogData, (blogData) => blogData.title.toLowerCase().includes('privacy'));
    const uniqueBlogTitles = _.uniqBy(blogData, 'title');

    // Prepare and send the response
    const statistics = {
      totalBlogs,
      longestBlog: longestBlog ? longestBlog.title : 'N/A',
      privacyBlogs: privacyBlogs.length,
      uniqueBlogTitles: uniqueBlogTitles.map((blog) => blog.title),
    };
    console.log(statistics);
    res.json(statistics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Blog search endpoint
app.get('/api/blog-search', async (req, res) => {
  const query = req.query.query.toLowerCase();

  if (!query) {
    res.status(400).json({ error: 'Query parameter "query" is required' });
    return;
  }

  try {
    if (!blogData) {
      blogData = await memoizedFetchBlogData();
    }

    const searchResults = _.filter(blogData, (blog) => blog.title.toLowerCase().includes(query));
    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
