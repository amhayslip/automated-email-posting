const { Octokit } = require('@octokit/rest');
const { Base64 } = require('js-base64');
const fs = require('fs');
const TurndownService = require('turndown');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');
const fetch = require('node-fetch');

require('dotenv').config();

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
});

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

const postToGithub = async (markdown, title) => {
  try {
    const content = markdown;
    const contentEncoded = Base64.encode(content);

    const { data } = await octokit.repos.createOrUpdateFileContents({
      // replace the owner and email with your own details
      owner: 'amhayslip',
      repo: 'weekly',
      path: `${title}.md`,
      message: 'Add new file',
      content: contentEncoded,
      committer: {
        name: `Octokit Bot`,
        email: 'your-email',
      },
      author: {
        name: 'Octokit Bot',
        email: 'your-email',
      },
    });

    console.log(data);
  } catch (err) {
    console.error(err);
  }
};

app.get('/', function(req, res) {
  res.send('hello world');
});

app.post('/addtogithub', function(req, res) {
  const { content } = req.body;
  const { title } = req.body;

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(content);

  postToGithub(markdown, title);

  res.send('done!');
});

const port = process.env.PORT || 5000;
app.listen(port);
