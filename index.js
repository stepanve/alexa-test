
"use strict";

const Alexa = require('ask-sdk-core');
const Adapter = require('ask-sdk-dynamodb-persistence-adapter'); // 永続アトリビュートを操作するために必要なモジュール

const fortunes = [
  { 'score': 'good', 'description': '星みっつで良いでしょう。' },
  { 'score': 'normal', 'description': '星ふたつで普通でしょう。' },
  { 'score': 'bad', 'description': '星ひとつでイマイチでしょう。' }
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
  async handle(handlerInput) { // getPersistentAttributes,savePersistentAttributesで非同期処理をawaitするのでasyncの付加が必要
    const sign = handlerInput.requestEnvelope.request.intent.slots.StarSign.value;  // スロットStarSignを参照
    const fortune = fortunes[Math.floor(Math.random() * fortunes.length)];  // ランダムに占い結果を取得
    const speechOutput = `今日の${sign}の運勢は${fortune.description}`; // 応答メッセージ文字列の作成
    const reprompt = "他にラッキーカラーが占えます。ラッキーカラーを聞きますか？"; //他の占いを追記

    const {attributesManager} = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes(); //セッションオブジェクトを取り出す
    sessionAttributes.sign = sign; // 星座をセッションアトリビュートに格納する
    attributesManager.setSessionAttributes(sessionAttributes); //セッションオブジェクトを格納する

    const persistentAttributes = await attributesManager.getPersistentAttributes(); //永続アトリビュートオブジェクトを取り出す。非同期処理なのでawaitを付加する
    persistentAttributes.sign = sign; // 星座を永続アトリビュートに格納する

    // 永続アトリビュートの保存
    attributesManager.setPersistentAttributes(persistentAttributes);
    await attributesManager.savePersistentAttributes(); // 非同期処理なのでawaitを付加する

    //レスポンスの生成
    return handlerInput.responseBuilder
      .speak(speechOutput + reprompt)
      .reprompt(reprompt) //ユーザーの反応を待つようにrepromptを加える
      .getResponse();
  }
};

const LuckyColorIntentHandler = {
  canHandle(handlerInput) {
    const {request} = handlerInput.requestEnvelope;
    return request.type === 'IntentRequest'
        && request.intent.name === 'LuckyColorIntent';
  },
  async handle(handlerInput) { // getPersistentAttributes()で非同期処理をawaitするのでasyncの付加が必要
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes(); //セッションオブジェクトを取り出す
    const persistentAttributes = await handlerInput.attributesManager.getPersistentAttributes(); //永続アトリビュートオブジェクトを取り出す。非同期処理なのでawaitを付加する
    const sign = sessionAttributes.sign || persistentAttributes.sign;

    if (!sign) {
      const speechOutput = 'そういえばまだ運勢を占っていませんでしたね。\
        今日の運勢を占います。たとえば、「ふたご座の運勢を教えて」と聞いてください';

      return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(speechOutput)
        .getResponse();
    }

    const luckyColor = luckyColors[Math.floor(Math.random() * luckyColors.length)];  // ランダムに占い結果を取得
    const speechOutput = `今日の${sign}のラッキーカラーは${luckyColor}です。今日も素敵な<sub alias="いちにち">一日</sub>を！`; // 応答メッセージ文字列の作成

    //レスポンスの生成
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .withShouldEndSession(true)
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
    const speechOutput = '今日の運勢を占います。 \
      たとえば、「ふたご座の運勢を教えて」と聞いてください';
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(speechOutput)
      .getResponse();
  },
};

const config = {
  tableName: 'HoroscopeSkillTable', // DynamoDBのテーブル名
  createTable: true // テーブルを自動生成する場合true (ただし権限が必要)
};
const DynamoDBAdapter = new Adapter.DynamoDbPersistenceAdapter(config);

const skillBuilder = Alexa.SkillBuilders.custom();

// Lambda関数のメイン処理
exports.handler = skillBuilder
  .addRequestHandlers(
    HelpHandler,
    HoroscopeIntentHandler,
    LuckyColorIntentHandler
  )
  .withPersistenceAdapter(DynamoDBAdapter) // DynamoDBAdapterをPersistenceAdapterに設定する
  .lambda();