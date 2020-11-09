const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const cors = require('cors');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('dotenv').config();

const ID = process.env.AWS_ACCESS_KEY_ID;
const SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const BUCKET_NAME = process.env.AWS_BUCKET;

const s3 = new AWS.S3({
  region: 'us-east-1',
  accessKeyId: ID,
  secretAccessKey: SECRET,
});

const uploadFile = (content, title, res) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: `${title}.html`, // File name you want to save as in S3
    Body: content,
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
    if (err) {
      throw err;
    }
    console.log(`File uploaded successfully. ${data.Location}`);
  });

  res.send('great success!');
};

app.post('/addfile', function(req, res) {
  const { content } = req.body;
  const { title } = req.body;

  const fileSafeTitle = title
    .split(' ')
    .join('-')
    .toLowerCase();

  uploadFile(content, fileSafeTitle, res);
});

app.get('/getFiles', function(req, res) {
  const getFile = function(key, callback) {
    s3.getObject({ Bucket: 'weekly-project-shift-emails', Key: key }, function(error, data) {
      callback({
        content: data.Body.toString('utf8'),
        title: key.split('.')[0],
      });

      if (error != null) {
        console.log(`Failed to retrieve an object: ${error}`);
      } else {
        console.log(`Loaded ${data.ContentLength} bytes`);
      }
    });
  };

  async function listAllObjectsFromS3Bucket(bucket, prefix) {
    let isTruncated = true;
    let marker;
    while (isTruncated) {
      const params = { Bucket: bucket };
      if (prefix) params.Prefix = prefix;
      if (marker) params.Marker = marker;
      try {
        const response = await s3.listObjects(params).promise();
        const myPromises = [];
        response.Contents.forEach(item => {
          myPromises.push(
            new Promise((resolve, reject) => {
              getFile(item.Key, function(data) {
                resolve(data);
              });
            })
          );
        });

        Promise.all(myPromises).then(values => {
          res.send(values);
        });

        isTruncated = response.IsTruncated;
        if (isTruncated) {
          marker = response.Contents.slice(-1)[0].Key;
        }
      } catch (error) {
        throw error;
      }
    }
  }

  listAllObjectsFromS3Bucket('weekly-project-shift-emails');
});

const port = process.env.PORT || 5000;
app.listen(port);
