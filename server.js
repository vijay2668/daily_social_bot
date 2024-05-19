import { Telegraf } from "telegraf";
import userModel from "./src/models/User.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
    console.log("ctx", ctx)

    const from = ctx.update.message.from;





    console.log('from', from)

    try {
        await userModel.findOneAndUpdate()
    } catch (err) {
        
    }

    // Store the user information into db
    await ctx.reply("Welcome to social bot, It's working");
    console.log("Welcome to social bot, It's working");
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))