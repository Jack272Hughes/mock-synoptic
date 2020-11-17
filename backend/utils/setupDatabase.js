const url = "mongodb://localhost:27017";
const dbName = "quizmaster";

const client = new require("mongodb").MongoClient(url, {
  useUnifiedTopology: true
});

client
  .connect()
  .then(client => {
    console.log("Connection Successful!");

    const operations = [];

    const db = client.db(dbName);
    if (process.env.SETUP_ALL || process.env.CREATE_INDEXES) {
      operations.push(
        db.collection("users").createIndex("username", { unique: true })
      );
      operations.push(
        db.collection("refreshTokens").createIndex("createdAt", {
          expireAfterSeconds: 2592000
        })
      );
    }

    if (process.env.SETUP_ALL || process.env.ADD_SEED_USERS) {
      operations.push(
        db.collection("users").insertOne({
          username: "Username",
          salt: "123abc",
          password:
            "96634cddae74babd0e48403d1ea1eb3c9961151d8bd39611e837bfc015431e26",
          role: "admin"
        })
      );
    }

    if (process.env.SETUP_ALL || process.env.ADD_SEED_QUIZZES) {
      operations.push(
        new Promise((resolve, reject) => {
          db.collection("quizzes")
            .insertOne({
              userOid: "123abc",
              name: "Maths Quiz",
              description: "Some basic maths questions to warm up your brain"
            })
            .then(dataObj => {
              const questionId = dataObj.insertedId;
              db.collection("questions")
                .insertMany([
                  {
                    quizId: questionId,
                    name: "What is 2 + 2?",
                    multipleAnswers: false,
                    answers: [
                      { correct: true, value: "4" },
                      { correct: false, value: "8" }
                    ]
                  },
                  {
                    quizId: questionId,
                    name: "What is 4 x 6?",
                    multipleAnswers: false,
                    answers: [
                      { correct: true, value: "24" },
                      { correct: false, value: "26" }
                    ]
                  },
                  {
                    quizId: questionId,
                    name: "Which answers will result in 16?",
                    multipleAnswers: true,
                    answers: [
                      { correct: true, value: "4 x 4" },
                      { correct: true, value: "8 x 2" },
                      { correct: false, value: "6 x 2" }
                    ]
                  }
                ])
                .then(() => resolve())
                .catch(err => reject(err));
            })
            .catch(err => reject(err));
        })
      );
    }

    if (process.env.SETUP_ALL || process.env.ADD_SEED_EMPTY_QUIZZES) {
      operations.push(
        db.collection("quizzes").insertMany([
          {
            userOid: "123abc",
            name: "English Quiz",
            description:
              "How many english words do you know the definition of? Test your skills with this amazing quiz!"
          },
          {
            userOid: "123abc",
            name: "Short quiz",
            description:
              "A couple of simple questions to help get you started on the app"
          }
        ])
      );
    }

    Promise.all(operations)
      .then(() => client.close())
      .catch(console.error);
  })
  .catch(console.error);
