const mongoose = require("mongoose");

export default () => {
    return mongoose.connect(process.env.MONGO_CONNECT_STRING);
}
