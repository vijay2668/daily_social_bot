import mongoose from "mongoose";

export default () => {
    return mongoose.connect("mongodb+srv://vijay2668:socialbot2668@socialbot.eadjqjy.mongodb.net/?retryWrites=true&w=majority&appName=SocialBot");
}
