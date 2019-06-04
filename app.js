const express = require("express");
const bodyParser = require("body-parser"); //post to req.body
//const request = require("request"); //no client request in this project
//const date = require(__dirname + "/date.js");  //only need in v1
const _=require("lodash"); //Make words to follwing a certain rule, e.g. Capitialize the first letter


//1.require, 2.connect 3.schema 4.model 5.create item 6.add items to db 7.find items 8.Delete items
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/todolistDB', {useNewUrlParser: true});

const itemsSchema = {    //Declare Mongo Schema: itemSchema
    name: String
};

const Item = mongoose.model("Item", itemsSchema); //Declare Mongo Model: Item

const item1 = new Item({   // Add 3 default items
   name: "item1"
});

const item2 = new Item({
   name: "item2"
});

const item3 = new Item({
   name: "item3"
});

const defaultItems = [item1, item2, item3];


const app = express();
//const items = ["buy flat", "buy car"]; //v1 only, array declare as constant also can change content
const workItems = [];
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.listen(process.env.PORT||3000, () => {
	console.log("Express listen on port 3000");
});

app.get("/", (req, res) => {	               //Send the content to list.
               //let day = date.getDate(); //Used in v1 only
               Item.find({}, (err, foundItems) => {      //{} if blank means find all in item
               //console.log(foundItems);
               if (foundItems.length === 0) {     //if no items, then add default items
			Item.insertMany(defaultItems, (err) => {
        		if(err) {console.log(err);}
        		else {console.log("default items ok")}
			});
		res.redirect("/"); //without need refresh 2 times.            
               }           
               else 
               res.render("list", {listTitle:"Today", newListItems:foundItems});
	});
 
});


app.post("/", (req, res) => {
	console.log("req.body.newItem:" + req.body.newItem);
	const item = new Item({           
 		name: req.body.newItem   //New item in root route
	});

        if (req.body.list === "Today") {   //req.body.list is defined in views/list.ejs when pressing + button
 		item.save();
        	res.redirect("/");  //if no this line, then home route hang.
	} else {
		List.findOne({name: req.body.list}, (err, foundList) => {
			foundList.items.push(item);
			foundList.save();
			res.redirect("/" +  req.body.list);
               });
	} //end if
});  //end app.post

app.post("/delete", (req, res) => {
	console.log("checkbox: " + req.body.checkbox);
        console.log("listName: " + req.body.listName); //app.js(listTitle) => views/list.ejs(listName) => app.js(listName)

	if(req.body.listName === "Today") {
		Item.findByIdAndRemove(req.body.checkbox, (err) => {  //req.body.checkbox is mongo _id of the item returned by views/list.ejs
             		if(!err) console.log("Delete item ok");
                });
		res.redirect("/");
	} else{
                //List is Mongo model with listSchema;  
                //req.body.listName locates the name in lists ;
		//$pull to delete an item in items array inside Mongo lists collections; 
		//foundList is the result
		List.findOneAndUpdate({name: req.body.listName}, {$pull: {items: {_id: req.body.checkbox}}}, (err, foundList) => {
			if(!err) res.redirect("/" +  req.body.listName);
			console.log("foundList: " + foundList);
                }); //end findOneAndUpdate	
	} //end if

});

const listSchema = {
	name: String,
	items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/:customListName", (req, res) => {      //dynamic route
	console.log(req.params.customListName);
         const customListName = _.capitalize(req.params.customListName);        

        //Mongoose findOne is to prevent double entry of new route to DB
	List.findOne({name: customListName}, (err, foundList) => {
		if(!err){
			if(!foundList)
                        {  console.log("Not Exist!");
                           //Create a new list
			   const list = new List({
				name: customListName,
				items: defaultItems
				});
			   list.save();
			   res.redirect("/" + customListName);	
                        }
		 	else{
                            console.log("Exist!");
                            //Show existing list
			     res.render("list", {listTitle: foundList.name, newListItems:foundList.items});	
			}
		} //end if !err
       	});  // end of List.findOne     
});  //end of app.get 

//v1
//app.get("/work", (req, res) => {
//	res.render("list", {listTitle: "Work List", newListItems:workItems});
//});


//app.post("/work", (req, res) =>{
//	let item = req.body.newItem;
//	workItems.push(item);
//	res.redirect("/work");
//});
