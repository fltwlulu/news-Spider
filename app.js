const express = require('express');
const	cheerio = require('cheerio');
const superagent= require('superagent');
const Nightmare = require('nightmare');          // 处理动态页面
const nightmare = Nightmare({ show: true });
const	app = express();


let getHotNews = () => {
  return new Promise((resolve, reject)  => {
    let hotArr = [];
    superagent.get('http://news.baidu.com/').end((err, res) => {
      if (err) {
        consoel.log(`热点新闻抓取失败 - ${err}`)
        reject(err);
      } else {
        let $ = cheerio.load(res.text);

        // 首要热点新闻
        let $hd0 = $('div.hotnews ul li.hdline0').find('a');
        let $hds = $("div.hotnews ul li:not('.hdline0')").find('a');
        hotArr[0] = {
          title: $hd0.text(),
          href: $hd0.attr('href'),
          item: []
        }
        $hds.each((idx, ele) => {
          hotArr[0].item[idx] = {
            title: $(ele).text(),
            href: $(ele).attr('href')
          }
        });

        // 热点新闻
        $('.ulist.focuslistnews').each((index, element) => {
          let $boldNews = $(element).find('.bold-item a');
          let $news = $(element).find('.bold-item ~ li a');
          hotArr[index+1] = {
            title: $boldNews.text(),
            href: $boldNews.attr('href'),
            item: []
          };
          $news.each((idx, ele) => {
            hotArr[index+1].item[idx] = {
              title: $(ele).text(),
              href: $(ele).attr('href')
            }
          });
        });

        resolve(hotArr);
      }
    });
  })
};

let getLocalNews = () => {
  return new Promise((resolve, reject) => {
    // 抓取本地新闻
    nightmare
    .goto('http://news.baidu.com/')
    .wait("div#local_news")
    .evaluate(() => document.querySelector("div#local_news").innerHTML)
    .then(local_news => {
      analysisData(local_news, resolve)
    })
    .catch(error => {
      console.error(`本地新闻抓取失败 - ${error}`);
      reject(error);
    })
  })
};

app.get('/', async (req, res, next) => {
  try {
    let hotArr = await getHotNews();
    let localArr = await getLocalNews();
    res.send({
      hotNews: hotArr.slice(0, hotArr.length - 1),
      localNews: localArr.slice(0, hotArr.length - 1)
    });
  } catch(err) {
    console.log(err);
    res.send(err)
  }
});


let analysisData = (local_news, resolve) => {
  let localArr = [];
  let $ = cheerio.load(local_news);

  // 本地新闻
  $('ul#localnews-focus').each((index, element) => {
    let $boldNews = $(element).find('.bold-item a');
    let $news = $(element).find('.bold-item ~ li a');
    localArr[index] = {
      title: $boldNews.text(),
      href: $boldNews.attr('href'),
      item: []
    };
    $news.each((idx, ele) => {
      localArr[index].item[idx] = {
        title: $(ele).text(),
        href: $(ele).attr('href')
      }
    });
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


let server = app.listen(33000, function () {
  let host = server.address().address;
  let port = server.address().port;
  console.log('WebWormSpider App is running at http://%s:%s', host, port);
});