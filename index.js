const fs = require('fs');
const TurndownService = require('turndown');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const saveFile = (md, title, res) => {
  fs.writeFile(`files/${title}.md`, md, err => {
    if (err) throw err;
    console.log('The file has been saved!');

    res.send('done!');
  });
};

app.get('/', function(req, res) {
  res.send('hello world');
});

app.post('/addfile', function(req, res) {
  const { content } = req.body;
  const { title } = req.body;

  const fileSafeTitle = title
    .split(' ')
    .join('-')
    .toLowerCase();

  const turndownService = new TurndownService();
  const markdown = turndownService.turndown(content);

  saveFile(markdown, fileSafeTitle, res);
});

const port = process.env.PORT || 5000;
app.listen(port);
