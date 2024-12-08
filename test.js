const nodejieba = require('nodejieba');
const natural = require('natural');
const fs = require('fs');

const stopwordsPath = './stopwords-iso.json';
const stopwordsData = JSON.parse(fs.readFileSync(stopwordsPath, 'utf8'));

const sentence = '红色的篮球鸡and a red basketball123';
const segments = sentence.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+|\s+|[0-9]+|[^\u4e00-\u9fa5a-zA-Z\s]/g);

const stopwords = stopwordsData.zh.concat(stopwordsData.en);  // 合并中文和英文停用词
const stopwordsSet = new Set(stopwords);

// 过滤分词结果

console.log(segments);

// 中文分词器处理中文，英文保持原样
const tokenizer = new natural.WordTokenizer();
const result = segments.map(word => {
  if (/[\u4e00-\u9fa5]/.test(word)) {
    return nodejieba.cut(word); // 中文分词
  } else if (/[a-zA-Z]+/.test(word)) {
    return tokenizer.tokenize(word); // 英文分词
  } else if (/[0-9]+/.test(word)) {
    return word; // 保留空格或符号
  }
  else {
    return null;
  }
})
.filter(word => word !== null)
.flat();

console.log(result);

const filteredWords = result.filter(word => !stopwordsSet.has(word.trim()));

console.log(filteredWords);

