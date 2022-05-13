import os
from dotenv import load_dotenv
from linebot.models import TextSendMessage, MessageEvent, TextMessage
from flask import Flask, request, abort
from linebot import LineBotApi, WebhookHandler
from linebot.exceptions import InvalidSignatureError
from pycoingecko import CoinGeckoAPI
from typing import Dict

load_dotenv()
Channel_Access_Token = os.environ.get('CHANNEL_ACCESS_TOKEN')
Channel_Secret = os.environ.get('CHANNEL_SECRET')


app = Flask(__name__)



line_bot_api = LineBotApi(Channel_Access_Token)

handler = WebhookHandler(Channel_Secret)

def now_prices(token: Dict):
    for k in token.keys():
       key_name = k
    return {'usd': token.get(key_name).get('usd'), 'twd': token.get(key_name).get('twd'),}

@app.route("/", methods=['GET'])
def ping():
    return 'pong'

# handle request from "/callback"
@app.route("/callback", methods=['POST'])
def callback():
    signature = request.headers['X-Line-Signature']
    body = request.get_data(as_text=True)

    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        abort(400)
    return 'OK'

# handle text message


@handler.add(MessageEvent, message=TextMessage)
def handle_message(event):
    msg = event.message.text
    print(msg)
    if event.source.user_id != '':
        if msg == '/gst':
            try:
                cg = CoinGeckoAPI()
                gmt = cg.get_price(ids='STEPN', vs_currencies=['usd','twd'])
                gst = cg.get_price(ids='green-satoshi-token', vs_currencies=['usd','twd'])
                sol = cg.get_price(ids='solana', vs_currencies=['usd','twd'])
                bnb = cg.get_price(ids='binancecoin', vs_currencies=['usd','twd'])
                # gst_bsc = pancakeswap_api(bsc_scan.get('GST_BSC'))
                gst_bsc = cg.get_price(ids='green-satoshi-token-bsc', vs_currencies=['usd','twd'])
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=f'''
🐻 Now Price 📊
🏃🏻 GST_SPL: 🇺🇸 USD: {now_prices(gst).get('usd')} / 🇹🇼 TWD: {now_prices(gst).get('twd')} 
🐥 GMT: 🇺🇸 USD: {now_prices(gmt).get('usd')} / 🇹🇼 TWD: {now_prices(gmt).get('twd')} 
🔮 SOL: 🇺🇸 USD: {now_prices(sol).get('usd')} / 🇹🇼 TWD: {now_prices(sol).get('twd')} 
🟡 BNB: 🇺🇸 USD: {now_prices(bnb).get('usd')} / 🇹🇼 TWD: {now_prices(bnb).get('twd')}
🏃🏻 GST_SPL: 🇺🇸 USD: {now_prices(gst_bsc).get('usd')} / 🇹🇼 TWD: {now_prices(gst_bsc).get('twd')} '''))
            except:
                line_bot_api.reply_message(
                    event.reply_token,
                    TextSendMessage(text=f'CoinGeckoAPI Error')
                )
        else:
            # line_bot_api.reply_message(
            #     event.reply_token,
            #     TextSendMessage(text=msg)
            # )
            pass


if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
