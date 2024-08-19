const Code = require('../models/Code')
const express = require('express')
const jwt = require('jsonwebtoken')
const router = express.Router()
// const path = require('path')


const isAlive = (req, res, next) => {
    if (!req.headers.authorization)
        return res.status(401).send("Unauthorized...");
    const token = req.headers.authorization.split(' ')[1]; 
    //Authorization: 'Bearer TOKEN'
    if(!token){
        return res.status(200).json({success:false, message: "Error! Token was not provided."});
    }
    //Decoding the token
    try{
        const decodedToken = jwt.verify(token,"thesecretcode" );
        // console.log(decodedToken)
        let data = {userId:decodedToken.userId, email:decodedToken.email}
    }
    catch (e) {
        if ( e instanceof jwt.TokenExpiredError )
            return res.status(403).json({success:false, message: "Error! Token has expired."});
    }
    next()
    return

    // if(req.session.user){
    //     next()
    //     return
    // }
    return res.status(401).send("Unauthorized...");
}


router.use(isAlive)

router.get('/search', async (req, res) => {
    try {
        search = req.query.search
        let queries = []
        // const newCode = new Code({name:"test.py",lang:"python",contents:"print(\"Hello World\")",meta:m,size:1});
        // await newCode.save();

        const count = await Code.find({ meta: { "$regex": search, "$options": "i" }}).count()
        if(!count){
            return res.status(204).json({ data: "No code snippets exist..." })
        }
        
        const limit = req.query.limit || 10;
        const page = parseInt(req.query.page) || 1;

        queries = await Code.find({ meta: { "$regex": search, "$options": "i" }}).sort({rating:-1,updatedAt:-1,is_correct:-1}).limit(limit).skip((page * limit) - limit);
        if (queries.length<=3){
            Code.updateMany({meta: { "$regex": search, "$options": "i" }, is_correct:true}, 
                {$inc:{"count":1}});
        }
        return res.status(200).json({ data: queries, count: count, page: page })
    } catch (err) {
        console.log(err)
        return res.status(500).send("Something went wrong!")
    }
})


router.post('/', async (req, res) => {
    console.log(req.body)
    let { name, lang, contents, m, size, author } = req.body;

    let meta = m.split(",")
    if (!name || !lang || !contents || !size) {
        return res.status(400).send("Required fields missing");
    }

    // let std_roll = req.session.user.rollno
    const newCode = new Code({ name, lang, contents, meta, size, author, is_correct: true, rating: -1, count: 0  });
    const saved = await newCode.save();

    if (saved) {
        return res.status(200).json({ data: newCode })
        // res.render('success', {roll:savedStd._id});
    }
    else {
        return res.status(500).json({ data: "Couldn't save query details" })
    }
})


router.put('/:id', async (req, res) => {
    let { rating, is_correct } = req.body;

    const existStd = await Code.findOne({ _id:req.params.id });
    if (!existStd) {
        return res.status(500).json({ msg: "Code snippet doesn't exist..." });
    }

    let count = existStd.count;
    let new_rating = 0;
    if (!rating)
        new_rating = existStd.rating
    else{
        new_rating = parseFloat(rating)
        // new_rating = rating

        if (existStd.rating!=-1){
            new_rating = (existStd.rating*count+new_rating)/(count+1);
            // console.log(existStd.rating*count,new_rating,count+1,new_rating)
        }
    }

    
    count++
    if (is_correct!=existStd.is_correct && existStd.count>20 && is_correct!=(new_rating>5))
        is_correct = existStd.is_correct //not allowed to change marking

    const std = await Code.findByIdAndUpdate(existStd.id, { "rating":new_rating, is_correct, count })

    if (std) {
        // console.log("Setting rating "+new_rating);
        return res.status(200).json({ data: "Updated successfully" })
    }
    else {
        return res.status(500).json({ msg: "Couldn't update code review" })
    }
})


module.exports = router