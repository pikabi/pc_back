from DrissionPage import ChromiumPage
from DrissionPage.common import Keys
import csv
import time
from url_encode import url_encode 
from datetime import datetime
import parsel
import json
from tqdm import tqdm

def get_jd_data():
    f = open('data_jd_raw.csv', 'w', encoding='utf-8', newline='')
    csv_writer = csv.DictWriter(f, fieldnames=['id', 'title', 'price', 'comment', 'shopName', 'url', 'img'])
    csv_writer.writeheader()

    dp = ChromiumPage()
    products = url_encode(encode=False)

    for product in tqdm(products):
        dp.get("https://www.jd.com/")
        dp.ele('css:#key').input(product)
        dp.ele('css:#key').input(Keys.ENTER)
        dp.listen.start('api.m.jd.com/?appid=search-pc-java&')
        time.sleep(10)
        dp.scroll.to_bottom()
        resp = dp.listen.wait()
        html = resp.response.body
        selector = parsel.Selector(html)
        lis = selector.css('.gl-item')
        for li in lis:
            try:
                id=li.css('::attr(data-sku)').get()
                title=li.css('.p-name a em::text').get()
                price=li.css('.p-price i::text').get()
                comment=li.css('.p-commit a::text').get()
                shopName=li.css('.hd-shopname::text').get()
                url='https:'+li.css('.p-name a::attr(href)').get()
                img=li.css('.p-img img::attr(data-lazy-img)').get().split('n7/')[-1]
                dit = {
                    "id": id,
                    "title": title.strip(),
                    "price": price,
                    "comment": comment.strip(),
                    "shopName": shopName.strip(),
                    "url": url,
                    "img": img
                }
                csv_writer.writerow(dit)
            except:
                    pass
    f.close()

def get_jd_details():
    f = open('data_jd_raw.csv', 'r', encoding='utf-8', newline='',errors='ignore')
    reader = csv.DictReader(f)
    rows = list(reader)
    total_rows = len(rows)
    batch_size = 100
    batch_num = 27
    while True:
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, total_rows)
        batch_num += 1
        if start_idx >= total_rows:
            break
        rows_batch = rows[start_idx:end_idx:4]
        timestamp = int(datetime.now().timestamp() * 1000)
        f_write = open(f'jd/data_jd{batch_num}_{timestamp}.csv', 'w', encoding='utf-8', newline='')
        csv_writer = csv.DictWriter(f_write, fieldnames=['id', 'title', 'price', 'comment', 'shopName', 'url', 'img', 'img_list', 'attriName1', 'attriListName', 'attriListImg', 'attriName2', 'attriListSize', 'attriName3', 'attriListMode','shopRating', 'extraPrice'])
        csv_writer.writeheader()
        dp = ChromiumPage()
        dp.get("https://www.jd.com/")
        success = 0
        for row in tqdm(rows_batch, desc=f'Processing batch {batch_num}'):
            dp.listen.start(row['url'])
            time.sleep(0.5)
            dp.get(row['url'])
            dp.scroll.to_bottom()
            time.sleep(15)
            resp = dp.listen.wait(timeout=60, count=1)
            try:
                html = resp.response.body
                selector = parsel.Selector(html)
                product = selector.css('.product-intro')
                photoList = product.css('.lh li')
                img_list = []
                for photo in photoList:
                    img = photo.css('img::attr(data-url)').get()
                    img_list.append(img)
                img_list = img_list[:5] if len(img_list) > 5 else img_list
                
                attributeList = product.css('div#choose-attrs .li.p-choose')
                attributeLen = len(attributeList)
                attriListName = []
                attriListImg = []
                attriListSize = []
                attriListMode = []
                attribute = attributeList[0]
                attriName1 = attribute.css('.dt::text').get()
                for attri in attribute.css('.dd div'):
                    name = attri.css('::attr(data-value)').get()
                    img = attri.css('img::attr(src)').get().split('40_')[-1]
                    attriListName.append(name)
                    attriListImg.append(img)

                if attributeLen >= 2:
                    attribute = attributeList[1]
                    attriName2 = attribute.css('.dt::text').get()
                    for attri in attribute.css('.dd div'):
                        size = attri.css('::attr(data-value)').get()
                        attriListSize.append(size)
                else:
                    attriName2 = ''
                    attriListSize = []
                
                if attributeLen >= 3:
                    attribute = attributeList[2]
                    attriName3 = attribute.css('.dt::text').get()
                    for attri in attribute.css('.dd div'):
                        mode = attri.css('::attr(data-value)').get()
                        attriListMode.append(mode)
                else:
                    attriName3 = ''
                    attriListMode = []

                shopName = row['shopName']
                if "自营" in shopName:
                    shopRating = 5.0
                else:
                    shopRating = selector.css('.J-hove-wrap .pop-score .star-gray::attr(title)').get()

                extraPrice = selector.css('.p-price .price::text').get()
                # 这里有的商品可能有优惠价，有的没有，我试了一下，有优惠的可能是我刚开了小号的原因。。大号跑出来就没有了，到时候合并两个就行
                price = row['price']
                [extraPrice, price] = [price, extraPrice]
                dit = {
                    "id": row['id'],
                    "title": row['title'],
                    "price": price,
                    "comment": row['comment'],
                    "shopName": row['shopName'],
                    "url": row['url'],
                    "img": row['img'],
                    "img_list": ', '.join(img_list),
                    "attriName1": attriName1,
                    "attriListName": ', '.join(attriListName),
                    "attriListImg": ', '.join(attriListImg),
                    "attriName2": attriName2,
                    "attriListSize": ', '.join(attriListSize),
                    "attriName3": attriName3,
                    "attriListMode": ', '.join(attriListMode),
                    "shopRating": shopRating,
                    "extraPrice": extraPrice,
                }
                csv_writer.writerow(dit)
                success += 1
                # print(attriName1)
                # print(attriListName)
                # print(attriListImg)
                # print(attriName2)
                # print(attriListSize)
                # print(attriName3)
                # print(attriListMode)
                # print(shopRating)
            except:
                pass
        f_write.close()
        time.sleep(100)
        if success <= 10:
            return
    f.close()

if __name__ == '__main__':
    # get_jd_data()
    get_jd_details()