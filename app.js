const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const format = require("date-fns/format");
const isMatch = require("date-fns/isMatch");
const isValid = require("date-fns/isValid");

app.use(express.json());

const db = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeTheDataBase = async () => {
  try {
    database = await open({
      filename: db,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server started running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB:ERROR ${e.message}`);
    process.exit(1);
  }
};

const hasCategoryAndPriority = (requestQuery) => {
  requestQuery.category !== undefined && requestQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasSearch = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

initializeTheDataBase();

// CONVERT THE DB INTO RESPONSE OBJECT:
const changeTheCase = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

// API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getQueries = "";
  const { search_q = "", category, priority, status } = request.query;

  switch (true) {
    // <...........SCENARIO-1................>
    case hasStatus(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getQueries = `
            SELECT *
            FROM todo
            WHERE status = '${status}'
            `;
        data = await database.all(getQueries);
        response.send(data.map((eachObject) => changeTheCase(eachObject)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // <...........SCENARIO-2................>
    case hasPriority(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getQueries = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}'
                `;
        data = await database.all(getQueries);
        response.send(data.map((eachObject) => changeTheCase(eachObject)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // <...........SCENARIO-3................>
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getQueries = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}'
                AND status = '${status}'
                `;
          data = await database.all(getQueries);
          response.send(data.map((eachObject) => changeTheCase(eachObject)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    // <...........SCENARIO-4................>

    case hasSearch(request.query):
      getQueries = `
          SELECT *
          FROM todo
          WHERE todo like '%${search_q}%'
          `;
      data = await database.all(getQueries);
      response.send(data.map((eachObject) => changeTheCase(eachObject)));
      break;

    // <...........SCENARIO-5................>

    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getQueries = `
                    SELECT *
                    FROM todo
                    WHERE category = '${category}'
                    AND status = '${status}'
                `;
          data = await database.all(getQueries);
          response.send(data.map((eachObject) => changeTheCase(eachObject)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    // <...........SCENARIO-6................>
    case hasCategory(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getQueries = `
            SELECT *
            FROM todo
            WHERE category = '${category}'
            `;
        data = await database.all(getQueries);
        response.send(data.map((eachObject) => changeTheCase(eachObject)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    // <...........SCENARIO-7................>
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getQueries = `
                SELECT *
                FROM todo
                WHERE category = '${category}'
                AND priority = '${priority}'
                `;
          data = await database.all(getQueries);
          response.send(data.map((eachObject) => changeTheCase(eachObject)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getQueries = `
        SELECT *
        FROM todo
        `;
      data = await database.all(getQueries);
      response.send(data.map((eachObject) => changeTheCase(eachObject)));

      break;
  }
});

// API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getIndividualDetails = `
    SELECT *
    FROM todo
    WHERE id = ${todoId}
    `;
  const result = await database.get(getIndividualDetails);
  response.send(changeTheCase(result));
});

// API-3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new date(date), "yyyy-MM-dd");
    const getDetails = `
        SELECT *
        FROM todo
        WHERE due_date = '${newDate}'
        `;
    const output = await database.all(getDetails);
    response.send(output.map((eachObject) => changeTheCase(eachObject)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

// API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const formatDate = format(new date(dueDate), "yyyy-MM-dd");
          const created = `
                INSERT INTO todo(id,todo,priority,status,category,due_date)
                VALUES (${id} , '${todo}','${priority}','${status}','${category}','${formatDate}')
                `;
          await database.run(created);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Category");
  }
});

// API-5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;

  const previous = `
    SELECT *
    FROM todo
    WHERE id = ${todoId}
    `;
  const previousToDo = await database.get(previous);
  const {
    todo = previousToDo.todo,
    category = previousToDo.category,
    priority = previousToDo.priority,
    status = previousToDo.status,
    dueDate = previousToDo.dueDate,
  } = request.body;

  let updateToDo = "";
  switch (true) {
    // <............UPDATING STATUS..........>
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateToDo = `
        UPDATE todo
        SET 
            todo = '${todo}',
            category = '${category}',
            priority = '${priority}',
            status = '${status}',
            due_date = '${dueDate}' 
        WHERE id = ${todoId}
        `;
        await database.run(updateToDo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;

    // <............UPDATING PRIORITY..........>
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateToDo = `
            UPDATE todo
            SET 
                todo = '${todo}',
                category = '${category}',
                priority = '${priority}',
                status = '${status}',
                due_date = '${dueDate}' 
            WHERE id = ${todoId}
            `;
        await database.run(updateToDo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    // <............UPDATING TODO..........>
    case requestBody.todo !== undefined:
      updateToDo = `
            UPDATE todo
            SET 
                todo = '${todo}',
                category = '${category}',
                priority = '${priority}',
                status = '${status}',
                due_date = '${dueDate}' 
            WHERE id = ${todoId}
            `;
      await database.run(updateToDo);
      response.send("Todo Updated");
      break;

    // <............UPDATING CATEGORY..........>
    case requestBody.category !== undefined:
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        updateToDo = `
            UPDATE todo
            SET 
                todo = '${todo}',
                category = '${category}',
                priority = '${priority}',
                status = '${status}',
                due_date = '${dueDate}' 
            WHERE id = ${todoId}
            `;
        await database.run(updateToDo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    // <............UPDATING DATE..........>
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new date(dueDate), "yyyy-MM-dd");
        updateToDo = `
                UPDATE todo
                SET 
                    todo = '${todo}',
                    category = '${category}',
                    priority = '${priority}',
                    status = '${status}',
                    due_date = '${dueDate}' 
                WHERE id = ${todoId}
                `;
        await database.run(updateToDo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

// API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteToDo = `
    SELECT *
    FROM todo
    WHERE id = ${todoId}
    `;
  const deleted = await database.run(deleteToDo);
  response.send("Todo Deleted");
});
module.exports = app;
