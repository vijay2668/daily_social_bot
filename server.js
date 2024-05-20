import { Telegraf } from "telegraf";
import userModel from "./src/models/User.js";
import eventModel from "./src/models/Event.js";
import connectDb from "./src/config/db.js";
import { message } from "telegraf/filters";
import OpenAI from "openai";
import express from "express";

const app = express()

app.get("/", (req, res) => {
    res.send("Bot is alive");
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const bot = new Telegraf("7050852809:AAGPRIY_KA1wPrLoNoy46MC1C4M-4uZchSk");

const openai = new OpenAI({
    apiKey: "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"
});

try {
    connectDb();
    console.log("Database connected successfully");
} catch (err) {
    console.log(err)
    process.kill(process.pid, 'SIGTERM');
}


bot.start(async (ctx) => {
    console.log("ctx", ctx)

    const from = ctx.update.message.from;

    console.log('from', from)

    try {
        await userModel.findOneAndUpdate({ tgId: from.id }, {
            $setOnInsert: {
                firstName: from.first_name,
                lastName: from.last_name,
                isBot: from.is_bot,
                username: from.username
            }
        }, {upsert: true, new: true});
    
    // Store the user information into db
    await ctx.reply(`Hey! ${from.first_name}, Welcome, I will be writing highly engaging social media posts for you 🚀 Just keep feeding me with the events throught the day. Let's shine on social media ✨️`);

    } catch (err) {
        console.log(err);
        await ctx.reply("Facing difficulties!");
    }
});

bot.help((ctx) => {
    ctx.reply("For support contact @code_vijay");
});

bot.command('generate', async (ctx) => {
    const from = ctx.update.message.from;

    const { message_id: waitingMessageId } = await ctx.reply(
        `Hey! ${from.first_name}, kindly wait for a moment. I am creating posts for you 🚀 ⏳️`
    );

    const { message_id: loadingStickerMsgId } = await ctx.replyWithSticker(
        "CAACAgIAAxkBAAMYZkpETTSX-HD87Hbo4k__1b7Z_8IAAgYAA8A2TxPHyqL0sm5wdjUE"
    );

    const startOfTheDay = new Date();
    startOfTheDay.setHours(0, 0, 0, 0);

    const endOfTheDay = new Date();
    endOfTheDay.setHours(23, 59, 59, 999);

    // get events for the user

    const events = await eventModel.find({
        tgId: from.id,
        createdAt: {
            $gte: startOfTheDay,
            $lte: endOfTheDay
        }
    });

    if (events.length === 0){
        await ctx.deleteMessage(waitingMessageId);
        await ctx.deleteMessage(loadingStickerMsgId);
        await ctx.reply("No events for the day.");
        return;
    };

    console.log('events', events);

    // make openai api call

    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Act as a senior copywriter, you write highly engaging posts for linkedin, facebook and twitter using provided thoughts/events throught the day."
                },
                {
                    role: "user",
                    content: `
                    Write like a human, for humans. Craft three engaging social media posts tailored for LinkedIn, Facebook, and Twitter audiences. Use simple language. Use given time labels just to understand the order of the event, don't mention the time in the posts. Each post should creatively highlight the following events. Ensure the tone is conversational and impactful. Focus on engaging the respective platform's audience, encouraging interaction, and driving interest in the events:
                    ${events.map((event) => event.text).join(", ")}
                    `
                }
            ],
            model: "gpt-3.5-turbo"
        });


        console.log('completion', chatCompletion)

        // store token count
        await userModel.findOneAndUpdate({
            tgId: from.id
        }, {
            $inc: {
                promptTokens: chatCompletion.usage.prompt_tokens,
                completionTokens: chatCompletion.usage.completion_tokens
            }
        });

       // send response.
        await ctx.deleteMessage(waitingMessageId);
        await ctx.deleteMessage(loadingStickerMsgId);
        await ctx.reply(chatCompletion.choices[0].message.content);

    } catch (err) {
        console.log(err)
        await ctx.reply("Facing difficulties");
    }
});


// bot.on(message('sticker'), (ctx) => {
//    console.log('sticker', ctx.update.message)
// })


bot.on(message('text'), async (ctx) => {
    const from = ctx.update.message.from;

    const message = ctx.update.message.text;

    try {
        await eventModel.create({
            text: message,
            tgId: from.id
        });

        await ctx.reply('Noted 👍, Keep texting me your thoughts. To generate the posts, Just enter the command: /generate');

    } catch (err) {
        console.log(err)
        await ctx.reply("Facing difficulties, please try again later.");
    }
    
});


bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
