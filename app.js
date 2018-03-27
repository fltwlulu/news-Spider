const express = require('express');
const cheerio = require('cheerio');
const superagent= require('superagent');
const Nightmare = require('nightmare');          // 自动化测试包，处理动态页面
const nightmare = Nightmare({ show: true });
const app = express();


/**
 * [description] - 抓取热点新闻页面
 * 获取热点新闻数据
 */
let getHotNews = () => {
  return new Promise((resolve, reject)  => {
    let hotArr = [];
    superagent.get('http://news.baidu.com/').end((err, res) => {
      if (err) {
        consoel.log(`热点新闻抓取失败 - ${err}`)
        reject(err);
      } else {
        let $ = cheerio.load(res.text);

        $('div#pane-news ul li a').each((idx, ele) => {
          let news = {
            title: $(ele).text(),
            href: $(ele).attr('href')
          };
          hotArr.push(news)
        });

        resolve(hotArr);
      }
    });
  })
};


/**
 * [description] - 抓取本地新闻页面
 * [nremark] - 百度本地新闻在访问页面后加载js定位IP位置后获取对应新闻，
 * 所以抓取本地新闻需要使用 nightmare 一类的自动化测试工具，
 * 模拟浏览器环境访问页面，使js运行，生成动态页面再抓取
 */
let getLocalNews = () => {
  return new Promise((resolve, reject) => {
    // 抓取本地新闻页面
    nightmare
    .goto('http://news.baidu.com/')
    .wait("div#local_news")
    .evaluate(() => document.querySelector("div#local_news").innerHTML)
    .then(local_news => {
      // 获取本地新闻数据
      analysisData(local_news, resolve)
    })
    .catch(error => {
      console.error(`本地新闻抓取失败 - ${error}`);
      reject(error);
    })
  })
};

/**
 * [description]- 获取本地新闻数据
 */
let analysisData = (local_news, resolve) => {
  let localArr = [];
  let $ = cheerio.load(local_news);

  // 本地新闻
  $('ul#localnews-focus li a').each((idx, ele) => {
    let news = {
      title: $(ele).text(),
      href: $(ele).attr('href'),
    };
    localArr.push(news)
  });

  // 本地资讯
  $('div#localnews-zixun ul li a').each((index, item) => {
    let news = {
      title: $(item).text(),
      href: $(item).attr('href')
    };
    localArr.push(news);
  });

  resolve(localArr)
}


/**
 * [description] - 接口路由
 */
app.get('/', async (req, res, next) => {
  try {
    let hotArr = await getHotNews();
    let localArr = await getLocalNews();
    res.send({
      hotNews: hotArr,
      localNews: localArr
    });
  } catch(err) {
    console.log(err);
    res.send(err)
  }
});


let server = app.listen(33000, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log('WebWormSpider App is running at http://%s:%s', host, port);
});
