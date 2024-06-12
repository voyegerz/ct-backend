import path from 'path'
import { fileURLToPath } from 'url';
import fs from 'fs'
import { dirname } from 'path';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv'
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import User from '../models/user.model.js';
import Post from '../models/post.model.js';

export const createPost = async(req, res) => {
    try {
        const {title, category, description} = req.body

        if(!title || !category || !description || !req.files) {
            return res.status(422).json({error: "Fill all the fields and choose thumbnail"})
        }

        const {thumbnail} = req.files

        if(thumbnail.size > 2000000) {
            return res.status(422).json({error: "Thumbnail should be less than 2mb"})
        }

        let filename = thumbnail.name
        let splittedFileName = filename.split('.')
        let newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]

        thumbnail.mv(path.join(__dirname, '..', '/uploads', newFileName), async(err) => {
            if(err) {
                return res.json(err)
            }

            const newPost = await Post.create({
                creator: req.user._id,
                title,
                category,
                description,
                thumbnail: newFileName
            })

            if(!newPost) {
                return res.status(422).json({error: "Post couldn't be created"})
            }

            //find user and increment post count by 1
            const currentUser = await User.findById(req.user._id)
            const userPostCount = currentUser.posts + 1

            await User.findByIdAndUpdate(req.user._id, {posts: userPostCount})

            res.status(201).json(newPost)
        })

    } catch (error) {
        console.log("Error in createPost controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const getPosts = async(req, res) => {
    try {
        const posts = await Post.find().sort({updatedAt: -1})
        res.status(200).json(posts)

    } catch (error) {
        console.log("Error in getPosts controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const getPost = async(req, res) => {
    try {
        const postId = req.params.id

        const post = await Post.findById(postId)
        if(!post) {
            return res.status(422).json({error: "Post not found"})
        }

        res.status(200).json(post)
    } catch (error) {
        console.log("Error in getPost controller", error.message)
        res.status(500).json({error: error.message})
    }
}

export const getCatPosts = async(req, res) => {
    try {
        const {category} = req.params

        const catPosts = await Post.find({category}).sort({createdAt: -1})

        res.status(200).json(catPosts)
    } catch (error) {
        console.log("Error in getCatPosts controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const getAuthorPosts = async(req, res) => {
    try {
        const {id} = req.params
        const posts = await Post.find({creator: id}).sort({createdAt: -1})

        res.status(200).json(posts)
    } catch (error) {
        console.log("Error in getAuthorPosts controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const editPost = async(req, res) => {
    try {
        let updatedPost

        const postId = req.params.id

        let {title, category, description} = req.body

        if(!title || !category || !description || description.length < 12) {
            return res.status(422).json({error: "Fill all the fields"})
        }

        if(!req.files) {
            updatedPost = await Post.findByIdAndUpdate(postId, {title, category, description}, {new: true})
        } else {
            const oldPost = await Post.findById(postId);

            if(req.user._id.toString() == oldPost.creator.toString()) {
                //delete old thumbnail from database
                fs.unlink(path.join(__dirname, '..', 'uploads', oldPost.thumbnail), async(err) => {
                    if(err) {
                        return res.json(err)
                    }
                }) 

                //upload new thumbnail
                const {thumbnail} = req.files

                if(thumbnail.size > 2000000) {
                    return res.status(422).json({error: "Thumbnail should be less than 2mb"})
                }

                let filename = thumbnail.name
                let splittedFileName = filename.split('.')
                let newFileName = splittedFileName[0] + uuid() + "." + splittedFileName[splittedFileName.length - 1]

                thumbnail.mv(path.join(__dirname, '..', 'uploads', newFileName), async(err) => {
                    if(err) {
                        return res.json(err)
                    }
                })

                updatedPost = await Post.findByIdAndUpdate(postId, {
                    title, 
                    category, 
                    description, 
                    thumbnail: newFileName
                }, {new: true})

            } else {
                return res.status(403).json({error: "Canno't edit post"})
            }
            
        }

        if(!updatedPost) {
            return res.status(400).json({error: "Can't update post"})
        }

        res.status(200).json(updatedPost)

    } catch (error) {
        console.log("Error in editPost controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}

export const deletePost = async(req, res) => {
    try {
        const postId = req.params.id

        if(!postId) {
            return res.status(400).json({error: "Post unavailable"})
        }

        const post = await Post.findById(postId)
        const fileName = post?.thumbnail

        if(req.user._id.toString() == post.creator.toString()) {
            //delete thumbnail from uploads folder
            fs.unlink(path.join(__dirname, '..', 'uploads', fileName), async(err) => {
                if(err) {
                    return res.json(err)
                } else {
                    await Post.findByIdAndDelete(postId)
    
                    const currentUser = await User.findById(req.user._id)
                    const userPostCount = currentUser.posts - 1
    
                    await User.findByIdAndUpdate(req.user._id, {posts: userPostCount})
                    res.status(200).json({ message: `Post ${postId} deleted successfully` })
                }
            })
        } else {
            return res.status(403).json({error: "Canno't delete post"})
        }

    } catch (error) {
        console.log("Error in deletePost controller", error.message)
        res.status(500).json({error: "Internal server error"})
    }
}