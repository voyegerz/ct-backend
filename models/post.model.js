import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }, 
    title: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ["News",  "NFTs",  "Research",  "Lunching pool", "Airdrop", "Ventures", "Market updates", "Tips and Tutorials", "Earn free crypto", "Web3"]
    },
    description: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    }
}, {timestamps: true})

const Post = mongoose.model("Post", postSchema)

export default Post