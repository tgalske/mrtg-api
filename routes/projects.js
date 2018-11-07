const express = require('express');
const router = express.Router();
const postgres = require('../postgres-connection');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const successResponse = { "response" : "success"};

/* GET projects listing. */
router.get('/', function(req, res) {
  postgres.task(t => {
    return t.map('SELECT * FROM projects', [], project => {
      return t.batch([
        t.any('SELECT text FROM project_paragraphs WHERE project_id = $1', project.id),
        t.any('SELECT text FROM project_tags WHERE project_id = $1', project.id),
      ])
        .then(data => {
          // store paragraphs+tags in array of strings not array of objects
          project.paragraphs = [];
          data[0].forEach( paragraphObject => project.paragraphs.push(paragraphObject.text));
          project.tags = [];
          data[1].forEach( tagObject => project.tags.push(tagObject.text));
          return project;
        });
    }).then(t.batch);
  })
    .then( data => {
      res.send(data);
    });
});

/* POST new project */
router.post('/', jsonParser, function(req, res, next) {
  const uuid = uuidv4();

  postgres.tx(t => {
    const postProject = t.none('INSERT INTO projects VALUES( $1, $2, $3, $4)', [uuid, req.body.name, req.body.time, req.body.img_url]);
    const postParagraphs = req.body.paragraphs.map( paragraph => {
      return t.none('INSERT INTO project_paragraphs VALUES( $1, $2, $3)', [uuidv4(), uuid, paragraph]);
    });
    const postTags = req.body.tags.map( tag => {
      return t.none('INSERT INTO project_tags VALUES( $1, $2, $3)', [uuidv4(), uuid, tag]);
    });

    return t.batch([postProject, postParagraphs, postTags]);
  })
    .then( () => {
      res.send(successResponse);
    })
    .catch( error => {
      res.send(error);
    });
});

router.delete('/:id', function (req, res, next) {
  postgres.tx(t => {
    const deleteParagraphs = t.none('DELETE FROM project_paragraphs WHERE project_id = $1', req.params.id);
    const deleteTags = t.none('DELETE FROM project_tags WHERE project_id = $1', req.params.id);
    const deleteProject = t.none('DELETE FROM projects WHERE id = $1', req.params.id);

    return t.batch([
      deleteParagraphs,
      deleteTags,
      deleteProject
    ]);
  })
    .then( () => {
      res.send(successResponse);
    })
    .catch( error => {
      res.send(error);
    });
});

module.exports = router;
