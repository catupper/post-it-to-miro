import {App, ReactionAddedEvent} from '@slack/bolt';
import { postPost} from "./createStickyNote";

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

const boardId = 'uXjVM-SV0PQ=';

app.event<'reaction_added'>('reaction_added', async ({ event, say, client }) => {
    if(event.reaction === 'miro'){
        if("message"  === event.item.type){
            const {ts, channel} = event.item;
            const result = await client.conversations.history({
                channel,
                latest: ts,
                inclusive: true,
                limit: 1,
            });
            const message = result.messages?.[0]
            if(message?.text !== undefined){
                await postPost(boardId, message.text, messageLink('slackappsandboxco', channel, ts));

            }
        }

    }

});

const messageLink = (workSpaceName: string, channelId: string, timeStamp: string): string => {
    return `https://${workSpaceName}.slack.com/archives/${channelId}/p${timeStamp.replace(".","")}`
}

(async () => {
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();
