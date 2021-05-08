jsonUtility = require('./json-utility');

class WebsocketMessageTracker {
    track(messageBuffer) {
        let message = '';
        message = messageBuffer.toString('utf-8', 0, messageBuffer.length);
        let firstIndex = message.indexOf("{");
        firstIndex = message.indexOf("]") < firstIndex ? message.indexOf("]") : firstIndex;
        let lastIndex = message.lastIndexOf("}");
        lastIndex = message.lastIndexOf("]") > lastIndex ? message.lastIndexOf("]") : lastIndex;
        message = message.substring(firstIndex, lastIndex + 1);
        if (jsonUtility.isValidJson(message)) {
            try {
                let data = JSON.parse(message);

                if (data.target == 'NewChangeEvent') {
                    console.log(data);
                }
            } catch (err) {
                console.error(err);
                console.log(message);
            }
        }
    }
}
module.exports = new WebsocketMessageTracker();