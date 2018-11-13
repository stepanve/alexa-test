"use strict";

const Alexa = require('ask-sdk-core');

const fortunes = [
  { 'score': 'good', 'description': '星みっつで良いでしょう' },
  { 'score': 'normal', 'description': '星ふたつで普通でしょう' },
  { 'score': 'bad', 'description': '星ひとつでイマイチでしょう' }
];

//ラッキーカラー一覧
const luckyColors = [
  '赤',
  'ピンク',
  'オレンジ',
  'ブルー',
  '水色',
  '紺色',
  '紫',
  '黒',
  'グリーン',
  'レモンイエロー',
  'ホワイト',
  'チャコールグレー'
];

// 対話モデルで定義した、占いを実行するインテントのハンドラ
const HoroscopeIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
      && request.intent.name === 'HoroscopeIntent';
  },
  async handle(handlerInput) {
    const sign = handlerInput.requestEnvelope.request.intent.slots.StarSign.value;  // スロットStarSignを参照
    const fortune = fortunes[Math.floor(Math.random() * 3)];  // ランダムに占い結果を取得
    const speechOutput = '今日の' + sign + 'の運勢は' + fortune.description; // 応答メッセージ文字列の作成
    const reprompt = "他にラッキーカラーが占えます。ラッキーカラーを聞きますか？"; //他の占いを追記

    let attributes = await handlerInput.attributesManager.getSessionAttributes(); //セッションオブジェクトを取り出す
    attributes.sign = sign;

    await handlerInput.attributesManager.setSessionAttributes(attributes); //セッションオブジェクトを格納する

    //レスポンスの生成
    return handlerInput.responseBuilder
      .speak(speechOutput + reprompt)
      .reprompt(reprompt) //ユーザーの反応を待つようにrepromptを加える
      .getResponse();
  }
};

const LuckyColorIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'IntentRequest'
        && request.intent.name === 'LuckyColorIntent';
  },
  async handle(handlerInput) {
    const attributes = await handlerInput.attributesManager.getSessionAttributes(); //セッションオブジェクトを取り出す
    let speechOutput;
    if (!attributes.sign) {
      speechOutput = "そういえばまだ運勢を占っていませんでしたね。";
      speechOutput += '今日の運勢を占います。' +
      'たとえば、ふたご座の運勢を教えてと聞いてください';

      //レスポンスの生成
      return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
    }

    const luckyColor = luckyColors[Math.floor(Math.random() * 12)];  // ランダムに占い結果を取得

    speechOutput = '今日の' + attributes.sign + 'のラッキーカラーは' + luckyColor + 'です。素敵な一日を。'; // 応答メッセージ文字列の作成

    //レスポンスの生成
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .getResponse();
  }
};

// スキル起動時またはスキルの使い方を尋ねるインテントのハンドラ
const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === 'LaunchRequest'
      || (request.type === 'IntentRequest'
        && request.intent.name === 'AMAZON.HelpIntent');
  },
  handle(handlerInput) {
    const speechOutput = '今日の運勢を占います。' +
      'たとえば、ふたご座の運勢を教えてと聞いてください';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

// Lambda関数のメイン処理
exports.handler = skillBuilder
  .addRequestHandlers(
    HoroscopeIntentHandler,
    LuckyColorIntentHandler,
    HelpHandler
  )
  .lambda();