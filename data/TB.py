import requests
import json
import hashlib
import time
import re
from datetime import datetime
from url_encode import url_encode
import csv
from DrissionPage import ChromiumPage
from DrissionPage.common import Keys
from tqdm import tqdm

def get_tb_data():
    f = open('data_tb_raw.csv', 'w', encoding='utf-8', newline='')
    csv_writer = csv.DictWriter(f, fieldnames=['id', 'title', 'price', 'procity', 'realSales', 'shopName', 'url', 'img', 'tmall'])
    csv_writer.writeheader()
    dp = ChromiumPage()
    dp.get("https://www.taobao.com/")
    cookie = dp.cookies().as_str()
    token = dp.cookies().as_dict()['_m_h5_tk'].split('_')[0]
    eS = '12574478'
    products = url_encode(encode=True)
    
    for product in tqdm(products):
        eC = int(datetime.now().timestamp() * 1000)
        n_data = '{"appId":"43356","params":"{\\"device\\":\\"HMA-AL00\\",\\"isBeta\\":\\"false\\",\\"grayHair\\":\\"false\\",\\"from\\":\\"nt_history\\",\\"brand\\":\\"HUAWEI\\",\\"info\\":\\"wifi\\",\\"index\\":\\"4\\",\\"rainbow\\":\\"\\",\\"schemaType\\":\\"auction\\",\\"elderHome\\":\\"false\\",\\"isEnterSrpSearch\\":\\"true\\",\\"newSearch\\":\\"false\\",\\"network\\":\\"wifi\\",\\"subtype\\":\\"\\",\\"hasPreposeFilter\\":\\"false\\",\\"prepositionVersion\\":\\"v2\\",\\"client_os\\":\\"Android\\",\\"gpsEnabled\\":\\"false\\",\\"searchDoorFrom\\":\\"srp\\",\\"debug_rerankNewOpenCard\\":\\"false\\",\\"homePageVersion\\":\\"v7\\",\\"searchElderHomeOpen\\":\\"false\\",\\"search_action\\":\\"initiative\\",\\"sugg\\":\\"_4_1\\",\\"sversion\\":\\"13.6\\",\\"style\\":\\"list\\",\\"ttid\\":\\"600000@taobao_pc_10.7.0\\",\\"needTabs\\":\\"true\\",\\"areaCode\\":\\"CN\\",\\"vm\\":\\"nw\\",\\"countryNum\\":\\"156\\",\\"m\\":\\"pc_sem\\",\\"page\\":2,\\"n\\":48,\\"q\\":\\"'+product+'\\",\\"qSource\\":\\"url\\",\\"pageSource\\":\\"\\",\\"tab\\":\\"all\\",\\"pageSize\\":\\"48\\",\\"totalPage\\":\\"100\\",\\"totalResults\\":\\"271783\\",\\"sourceS\\":\\"0\\",\\"sort\\":\\"_coefp\\",\\"filterTag\\":\\"\\",\\"service\\":\\"\\",\\"prop\\":\\"\\",\\"loc\\":\\"\\",\\"start_price\\":null,\\"end_price\\":null,\\"startPrice\\":null,\\"endPrice\\":null,\\"p4pIds\\":\\"687826720714,776614415723,685732397339,835552500799,742154069160,607018640240,837656749317,744572104333,750153834479,686884666904,771415029404,776635498652,688440299743,734256229258,824425430027,819123245464,760671733631,803849584080,737427173845,701956599423,820143991420,829037766915,817028924318,727720474569,742859406064,736631058967,751833160615,828565083929,833156334241,750062657704,684997504906,682728101866,697672383845,729714574420,835473962577,832466359964,801438237114,812222101147,834176426104,657163617834,817532325023,682075865208,546751176926,829175993044,744829991552,655369100409,697262169801,735178838464,815948373394,737676700109,752711970083,738390771565,635560852722,687908650453,816946679230,775649194608,754099626952,680062700961,683187753372,831790385953,655787907876,637425641729,801080284175,756968202079,735861118402,672633812285,617968142603,684004287386,828616816364\\",\\"categoryp\\":\\"\\",\\"myCNA\\":\\"UMRaG4KiPmUCAX1/t3ViXq7Z\\",\\"clk1\\":\\"6d5c00012a0c4080143c7a85f57413bf\\",\\"refpid\\":\\"mm_26632258_3504122_32538762\\"}"}'
        string = token + "&" + str(eC) + "&" + eS + "&" + n_data
        MD5 = hashlib.md5()
        MD5.update(string.encode('utf-8'))
        sign = MD5.hexdigest()

        headers = {
            'cookie': cookie,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        }
        url = 'https://h5api.m.taobao.com/h5/mtop.relationrecommend.wirelessrecommend.recommend/2.0/'
        data = {
            'jsv':'2.7.2',
            'appKey': eS,
            't': eC,
            'sign': sign,
            'api':'mtop.relationrecommend.wirelessrecommend.recommend',
            'v':'2.0',
            'type':'jsonp',
            'dataType':'jsonp',
            'callback':'mtopjsonp14',
            'data': n_data,
        }

        response = requests.get(url=url, headers=headers, params=data)
        text = response.text

        json_str = re.findall('mtopjsonp\d+\((.*)', text)[0][:-1]
        json_data = json.loads(json_str)
        itemsArray = json_data['data']['itemsArray']
        # cnt = 0
        for item in itemsArray:
            # cnt = cnt+1
            # if cnt > 25:
            #     break
            if 'item_id' in item and 'title' in item and 'price' in item and 'procity' in item and 'realSales' in item and 'shopInfo' in item and 'clickUrl' in item and 'pic_path' in item:
                dit = {
                    'id': item['item_id'],
                    'title': item['title'],
                    'price': item['price'],
                    'procity': item['procity'],
                    'realSales': item['realSales'].replace('人付款', ''),
                    'shopName': item['shopInfo']['title'],
                    'url': item['clickUrl'],
                    'img': item['pic_path'],
                    'tmall': any(icon['alias'] == 'tmall' for icon in item['icons']),
                }
                csv_writer.writerow(dit)
    
    f.close()

def get_tb_details():
    f = open('data_tb_raw.csv', 'r', encoding='utf-8', newline='')
    reader = csv.DictReader(f)
    rows = list(reader)
    total_rows = len(rows)
    batch_size = 100
    batch_num = 46
    while True:
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, total_rows)
        batch_num += 1
        if start_idx >= total_rows:
            break
        # rows_batch = rows[start_idx:end_idx:2]
        rows_batch = rows[start_idx:end_idx:4]
        timestamp = int(datetime.now().timestamp() * 1000)
        f_write = open(f'tb/data_tb{batch_num}_{timestamp}.csv', 'w', encoding='utf-8', newline='')
        csv_writer = csv.DictWriter(f_write, fieldnames=['id', 'title', 'price', 'procity','realSales', 'shopName', 'url', 'img', 'tmall', 'img_list', 'attriName1', 'attriListName', 'attriListImg', 'attriName2', 'attriListSize', 'attriName3', 'attriListMode', 'attriName4', 'attriListType', 'shopRating', 'extraPrice'])
        csv_writer.writeheader()
        dp = ChromiumPage()
        dp.get("https://www.taobao.com/")
        success = 0
        for row in tqdm(rows_batch, desc=f'Processing batch {batch_num}'):
            if row['tmall'] == 'True':
                listen_url = 'https://h5api.m.tmall.com/h5/mtop.taobao.pcdetail.data.get/1.0/?'
                # listen_rate_url = 'https://h5api.m.tmall.com/h5/mtop.taobao.rate.detaillist.get/6.0/?'
            else: 
                listen_url = 'https://h5api.m.taobao.com/h5/mtop.taobao.pcdetail.data.get/1.0/?'
                # listen_rate_url = 'https://h5api.m.taobao.com/h5/mtop.taobao.rate.detaillist.get/6.0/?'
            dp.listen.start(listen_url)
            time.sleep(0.5)
            dp.get(row['url'])
            time.sleep(2)
            # dp.scroll.to_bottom()
            time.sleep(8)
            try:
                resp = dp.listen.wait(timeout=60,count=1)
                html = resp.response.body
                if isinstance(html, dict):
                    pass
                else:
                    match = re.match(r"^mtopjsonppcdetail\d*\((.*)\)", html.strip())
                    if match:
                        json_str  = match.group(1)
                        html = json.loads(json_str)
                data = html['data']
                if 'extraPrice' in data['componentsVO']['priceVO']:
                    extraPrice = data['componentsVO']['priceVO']['extraPrice']['priceText']
                else:
                    extraPrice = row['price']
                shopRatings = [float(item['score'].strip()) for item in data['seller']['evaluates']]
                shopRating = round(sum(shopRatings) / len(shopRatings), 1)
                img_list = data['item']['images']
                props = data['skuBase']['props']
                attriName1 = props[0]['name']
                attriListName = []
                attriListImg = []
                attriListSize = []
                attriListMode = []
                attriListType = []
                contains_image = any('image' in value for value in props[0]['values'])
                if contains_image:
                    attriListName = [value['name'] for value in props[0]['values'] if 'image' in value]
                    attriListImg = [value['image'] for value in props[0]['values'] if 'image' in value]
                else:
                    attriListName = [value['name'] for value in props[0]['values']]
                if len(props) >= 2:
                    attriName2 = props[1]['name']
                    contains_image = any('image' in value for value in props[1]['values'])
                    if contains_image:
                        attriName2, attriName1 = attriName1, attriName2
                        attriListSize = attriListName
                        attriListName = [value['name'] for value in props[1]['values'] if 'image' in value]
                        attriListImg = [value['image'] for value in props[1]['values'] if 'image' in value]
                    else:
                        attriListSize = [value['name'] for value in props[1]['values']]
                else:
                    attriName2 = ''
                    attriListSize = []
                if len(props) >= 3:
                    attriName3 = props[2]['name']
                    contains_image = any('image' in value for value in props[2]['values'])
                    if contains_image:
                        attriName3, attriName1 = attriName1, attriName3
                        attriListMode = attriListName
                        attriListName = [value['name'] for value in props[2]['values'] if 'image' in value]
                        attriListImg = [value['image'] for value in props[2]['values'] if 'image' in value]
                    else:
                        attriListMode = [value['name'] for value in props[2]['values']]
                else:
                    attriName3 = ''
                    attriListMode = []
                if len(props) >= 4:
                    attriName4 = props[3]['name']
                    contains_image = any('image' in value for value in props[3]['values'])
                    if contains_image:
                        attriName4, attriName1 = attriName1, attriName4
                        attriListType = attriListName
                        attriListName = [value['name'] for value in props[3]['values'] if 'image' in value]
                        attriListImg = [value['image'] for value in props[3]['values'] if 'image' in value]
                    else:
                        attriListType = [value['name'] for value in props[3]['values']]
                else:
                    attriName4 = ''
                    attriListType = []
                dit = {
                    "id": row['id'],
                    "title": row['title'],
                    "price": row['price'],
                    'procity': row['procity'],
                    'realSales': row['realSales'], 
                    "shopName": row['shopName'],
                    "url": row['url'],
                    "img": row['img'],
                    'tmall': row['tmall'],
                    "img_list": ', '.join(img_list),
                    "attriName1": attriName1,
                    "attriListName": ', '.join(attriListName),
                    "attriListImg": ', '.join(attriListImg),
                    "attriName2": attriName2,
                    "attriListSize": ', '.join(attriListSize),
                    "attriName3": attriName3,
                    "attriListMode": ', '.join(attriListMode),
                    "attriName4": attriName4,
                    "attriListType": ', '.join(attriListType),
                    "shopRating": shopRating,
                    "extraPrice": extraPrice,
                }
                csv_writer.writerow(dit)
                success += 1
                # print(extraPrice)
                # print(shopRating)
                # print(img_list)
                # print(attriName1)
                # print(attriListName)
                # print(attriListImg)
                # print(attriName2)
                # print(attriListSize)
                # print(attriName3)
                # print(attriListMode)
            except:
                pass
        f_write.close()
        time.sleep(100)
        if success <= 5:
            return
    f.close()

if __name__ == '__main__':
    # get_tb_data()
    get_tb_details()