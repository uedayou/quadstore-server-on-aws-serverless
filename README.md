# quadstore-server-on-aws-serverless

SPARQLエンドポイントをAWSサーバーレス環境下に作成するためのプロジェクトです。
AWSの以下のサービスを利用します。

- [AWS API Gateway](https://aws.amazon.com/api-gateway/)
- [AWS Lambda](https://aws.amazon.com/lambda/)

RDF Storeに[node-quadstore](https://github.com/beautifulinteractions/node-quadstore)と[levelDB](https://github.com/google/leveldb)を利用しています。

## RDF Storeの準備

あらかじめ Turtleファイルを使って levelDBファイルを作成しておきます。
サンプルとして 国立国会図書館が公開する[「図書館及び関連組織のための国際標準識別子（ISIL）」試行版LOD](https://www.ndl.go.jp/jp/dlib/standards/opendataset/index.html)のTurtleファイルを同梱しています。

```
cd quadstore-server-on-aws-serverless/quadstore-server-lambda
npm install
npm run build:db -- ../sample/isillod.ttl
```

これで、`sparql-db`ディレクトリが作成されます。

## デプロイ方法

デプロイには、[AWS SAM](https://aws.amazon.com/serverless/sam/)を利用します。
[AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)をあらかじめインストール、設定しておいてください。

```
cd quadstore-server-on-aws-serverless 
sam build
sam deploy --guided ※ 二回目以降は sam deploy でデプロイできます。
```

デプロイ後に表示される`QuadstoreServerApi`のURLが実際のエンドポイントとなります。

## ローカルでの動作確認

以下のコマンドにより、ローカル環境で実行が可能です。実行には、Dockerが必要です。

```
cd quadstore-server-on-aws-serverless
sam local invoke --event events/event.json
```

これで以下のSPARQLクエリが実行されます。
```
select (count(distinct *) as ?count) 
where {
  ?s ?p ?o
}
```

AWS SAM CLI のその他の利用については以下を参照してください。

<https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/serverless-getting-started-hello-world.html>
