import User from "../models/user.model.js"
import Payment from "../models/payment.model.js"
import { razorpay } from "../server.js"
import AppError from "../utils/appError.js"
import crypto from "crypto";
import asyncHandler from "../middlewares/asyncHandler.middleware.js";


export const getRazorpayApiKey = async(req, res, next)=>{
    try {
        res.status(200).json({
            success:true,
            message:"Razorpay Api Key",
            key: process.env.RAZORPAY_KEY_ID
        })
    } catch (error) {
        return next( new AppError (error.message, 500))
    }
}

export const buySubscription = async(req, res, next)=>{
    try {
        const { id } = req.user;

        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User does not exist", 404))
        }

        if(user.role === "ADMIN"){
            return next(new AppError("ADMIN cannot buy subscription", 400))
        }

        if(user.subscription.status === "active"){
            return next(new AppError("User already has an active subscription", 400))
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify:1,
            total_count : 12 // 12 means it will charge every month for a 1-year sub.
        });

        // update user subscription

        user.subscription.id = subscription.id;
        user.status.status = subscription.status;

        await user.save();

        res.status(200).json({
            success:true,
            message:"Subscription Successfully",
            subscription_id: subscription.id
        })

    } catch (error) {
        return next(new AppError(error.message, 500))
    }
}

export const verifySubscription = async(req, res, next)=>{
    try {
        const { id } = req.user;
        const user = await User.findById(id);

        if(!user){
            return next(new AppError("User does not exist", 404))
        }
        
        const {
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id 
        } = req.body;

        const generatedSignature = crypto
        .createHmac("sha256",process.env.RAZORPAY_SECRET)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest("hex");

        if( generatedSignature !== razorpay_signature){
            return next(
                new AppError ("payment verification failed , signature mismatch ", 400)
            )
        }

        await Payment.create({
            user: user._id,
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id,
        });

        user.subscription.status = "active";
        await user.save();

        res.status(200).json({
            success:true,
            message:"Payment Verified"
        });

    } catch (error) {
        return next(new AppError(error.message, 500))
    }
}

export const cancelSubscription = async(req, res, next)=>{
    try {
        const { id } = req.user;
        const user = await User.findById(id);

        if (!user) {
            return next(new AppError("User does not exist", 404))
        }

        if(user.role === "ADMIN"){
            return next(new AppError("ADMIN cannot cancel subscription", 400))
        }
        
        const subscriptionId = user.subscription.id;
        
        const subscription = await razorpay.subscriptions.cancel(subscriptionId);

        user.subscription.status = "inactive";
        await user.save();

        res.status(200).json({
            success:true,
            message:"Subscription Cancelled"
        });
    } catch (error) {
        return next(new AppError(error.message, 500))
    }
}

export const getAllPayments = asyncHandler(async (req, res, next) => {
    
});