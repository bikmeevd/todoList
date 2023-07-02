//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _ = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb+srv://admin-bikmeev:BVsFiecvoTGVruO8@cluster0.lefa5xc.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({name:"Welcome to your todolist!"});
const item2 = new Item({name:"Hit the + button to add a new item."});
const item3 = new Item({name:"<--- Hit this to delete an item."});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema ({
  name : String,
  items: [itemsSchema]
});
const List = mongoose.model('List', listSchema);

async function insertManyItems() {
  try {
    await Item.insertMany(defaultItems);
    console.log("Inserted successfully");
  } catch (err) {
    console.log(err);
  }
}

var items = [];


app.get("/", function(req, res) {
  async function findItems() {
    try {
      items = await Item.find({});
      if (items.length === 0) {
        insertManyItems();
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    } catch (err) {
      console.log(err);
    }
  }
  findItems();
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item ({name: itemName});

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    async function insertCustomitem() {
      try {
        const foundList = await List.findOne({name: listName});
        foundList.items.push(item);
        foundList.save();
        res.redirect("/"+ listName);
      } catch (err) {
        console.log(err);
      }
    }
    insertCustomitem();
  }


});



app.post("/delete", function(req, res) {
  const checkItemId = req.body.checkBox;
  const listName = req.body.listName;

  if(listName === "Today") {
    async function deleteItem() {
      try {
        await Item.findByIdAndRemove({_id: checkItemId});
        res.redirect("/");
      } catch (err) {
        console.log(err);
      }
    }
    deleteItem();
  } else {
    async function makePull() {
      try {
        let foundList = await List.findOne({name: listName});
        foundList.items.pull({_id: checkItemId});
        foundList.save();
      } catch (err) {
        console.log(err);
      }
    }
    makePull();
    res.redirect("/"+ listName);
  }

});


app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  async function existingList() {
    try {
      const foundList = await List.findOne({name:customListName})
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items})
      }
    } catch (err) {
      console.log(err);
    }
  }
  existingList();
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
