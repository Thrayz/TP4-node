const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const mongoose = require('mongoose');
require ('dotenv').config();
const router = express.Router();
app.use(router);


const dotenv = require('dotenv');
const path = require('path');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const User = require('./models/user');


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));




mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.log('Error connecting to MongoDB', err);
});

const catgorieSchema = new mongoose.Schema({
    name: String,   
    description: String
});

const Categorie = mongoose.model('Categorie', catgorieSchema);

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String,
    categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' }
});

const Product = mongoose.model('Product', productSchema);

app.get('/categories', async (req, res) => {
    const categories = await Categorie.find();
    res.render('categories', { categories: categories });
});

app.post('/categories', async (req, res) => {
    const categorie = new Categorie({
        name: req.body.name,
        description: req.body.description
    });
    await categorie.save();
    res.send(categorie);
});

app.get('/categories/:id', async (req, res) => {    
    const categorie = await Categorie.findById(req.params.id);
    if (!categorie) return res.status(404).send('The categorie with the given ID was not found');
    res.send(categorie);
});

app.put('/categories/:id', async (req, res) => {   
    const categorie = await Categorie.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        description: req.body.description
    }, { new: true });
    if (!categorie) return res.status(404).send('The categorie with the given ID was not found');
    res.send(categorie);
});

app.delete('/categories/:id', async (req, res) => {
    const categorie = await Categorie.findByIdAndRemove(req.params.id);
    if (!categorie) return res.status(404).send('The categorie with the given ID was not found');
    res.send(categorie);
});


app.get('/products', async (req, res) => {
    const products = await Product.find().populate('categorie');
    res.render('products', { products: products});
});

app.post('/products', async (req, res) => {   
    console.log(req.body);
    const categorie = await Categorie.findById(req.body.categorieId);
    console.log(categorie);
    if (!categorie) return res.status(400).send('Invalid Categorie');
    const product = new Product({
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        categorie: categorie._id
    });
    await product.save();
    res.send(product);
});

app.get('/products/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('categorie');
    if (!product) return res.status(404).send('The product with the given ID was not found');
    res.send(product);
});

app.put('/products/:id', async (req, res) => {
    const categorie = await Categorie.findById(req.body.categorieId);
    if (!categorie) return res.status(400).send('Invalid Categorie');
    const product = await Product.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        categorie: categorie._id
    }, { new: true });
    if (!product) return res.status(404).send('The product with the given ID was not found');
    res.send(product);
});

app.delete('/products/:id', async (req, res) => {
    const product = await Product.findByIdAndRemove(req.params.id);
    if (!product) return res.status(404).send('The product with the given ID was not found');
    res.send(product);
});

app.get('/categories/:id/products', async (req, res) => {
    const products = await Product.find({ categorie: req.params.id }).populate('categorie');
    res.send(products);
}); 

app.get('/products/:id/categorie', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('categorie');
    if (!product) return res.status(404).send('The product with the given ID was not found');
    res.send(product.categorie);
});


app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});





router.post('/register',async (req,res)=>{
    try {
        console.log(req.body); 
        const {username,password}=req.body;
        if (!password) {
            return res.status(400).send('Password is required');
        }
        const user = new User({username,password});
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(400).send(error.message)
    }
})


router.post('/login',async (req,res)=>{
   try {
    const {username,password}=req.body;
    const user = await User.findOne({username: username});
    if(!user){
        return res.status(404).send('user not found')
    }
    const isPasswordMatch =await bcrypt.compare(password,user.password);
  if(!isPasswordMatch){
    return res.status(401).send('invalid password')
  }
   const token = jwt.sign({_id:user._id},process.env.JWT_SECRET);
   res.send({token:token})
   } catch (err) {
    res.status(400).send(err.message)
   }
});



router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/login', (req, res) => {
    res.render('login');
});


app.get('/add-product', async (req, res) => {
    try {
        const categories = await Categorie.find({});
        res.render('add-product', { categories });
    } catch (error) {
        res.status(500).send(error.message);
    }
});


router.get('/add-category', (req, res) => {
    res.render('add-category');
});



router.get('/update-category/:id', async (req, res) => {
    const categorie = await Categorie.findById(req.params.id);
    res.render('update-category', { categorie: categorie });
});

router.get('/update-product/:id', async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('update-product', { product: product });
});