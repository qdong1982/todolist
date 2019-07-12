//jshint esversion:6

//install nmp in terminal or hyper then require them here
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");

// const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];
//Instead of pushing the item into the items const, we will use mongoose.
mongoose.connect("mongodb+srv://admin-quang:test123456@cluster0-lztzd.mongodb.net/todolistDB", {
  useNewUrlParser: true,
  useFindAndModify: false
}); //replace mongoose local ("mongodb://localhost27017/(databaseName)") conncection with mongoose server

//Create an item database
const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

//Item1-item3 is embedded (more like direction for users)
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

//Create a list database
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {

  // const day = date.getDate();
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully inserted item");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
      //passing over the foundItems to newlistitem
    }
  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });

  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

//Express Route Parameters
app.get('/:customListName', function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect('/' + customListName);

      } else {
        //show an existing listTitle

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });


});

app.post('/delete', function (req, res) {
  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;
  //check if the delete is on Today or customListName

  if (listName === "Today") {
    Item.findByIdAndRemove(checkItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect('/');
      }
    });
  } else {

    //Mongoose findOneAndUpdate: e.g. ModelName.findOneAndUpdate({condition},{what do you want to update}, callback function)
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkItemId
        }
      }
    }, function (err, foundList) {
      if (!err) {
        res.redirect("/" + listName);
      }
    });
  }

});

app.get("/work", function (req, res) {
  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started Successfully");
});