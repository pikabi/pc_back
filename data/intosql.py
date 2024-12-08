import pandas as pd
import math
import time
import mysql.connector
import re
import subprocess
import requests

def Tosql_products_tb():

    df = pd.read_csv('tb/data_tb_all.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    for i, row in df.iterrows():
        # if i > 100:
        #     break
        # print(i)
        id_value = row['id']            
        platform = 'tm' if row['tmall'] == True else 'tb'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            if len(str(row['attriListName']).split(', ')) != len(str(row['attriListImg']).split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            if str(row['realSales'])== 'nan':
                sale = 0
            else :
                sale = row['realSales'].replace('+', '')
                sale = sale.replace('万', '0000')
            variety = len(row['attriListName'].split(', '))

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriName2 = ''
            else:
                has_size = True
                variety = variety * len(row['attriListSize'].split(', '))
                attriName2 = row['attriName2']

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriName3 = ''
            else:
                has_mode = True
                variety = variety * len(row['attriListMode'].split(', '))
                attriName3 = row['attriName3']

            if row['attriName4'] == '' or str(row['attriName4']) == 'nan':
                has_type = False
                attriName4 = ''
            else:
                has_type = True
                variety = variety * len(row['attriListType'].split(', '))
                attriName4 = row['attriName4']

            procity = row['procity'].strip().split(' ')[0]
            sql = "INSERT INTO products (name, price, total_sales, image_url, url, shopRating, shopName, has_mode, has_size, platform, procity, has_type, extraPrice, platformID, attriName1, attriName2, attriName3, attriName4, comment, variety) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (row['title'], row['price'], sale, row['img'], row['url'], row['shopRating'], row['shopName'] , has_mode, has_size, platform, procity, has_type, row['extraPrice'], row['id'], row['attriName1'], attriName2, attriName3, attriName4, 0 , variety))
        else:
            if len(str(row['attriListName']).split(', ')) != len(str(row['attriListImg']).split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            sale = row['realSales'].replace('+', '')
            sale = sale.replace('万', '0000')
            variety = len(row['attriListName'].split(', '))

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriName2 = ''
            else:
                has_size = True
                variety = variety * len(row['attriListSize'].split(', '))
                attriName2 = row['attriName2']

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriName3 = ''
            else:
                has_mode = True
                variety = variety * len(row['attriListMode'].split(', '))
                attriName3 = row['attriName3']

            if row['attriName4'] == '' or str(row['attriName4']) == 'nan':
                has_type = False
                attriName4 = ''
            else:
                has_type = True
                variety = variety * len(row['attriListType'].split(', '))
                attriName4 = row['attriName4']

            procity = row['procity'].strip().split(' ')[0]
            sql = "UPDATE products SET name = %s, price = %s, total_sales = %s, image_url = %s, url = %s, shopRating = %s, shopName = %s, has_mode = %s, has_size = %s, platform = %s, procity = %s, has_type = %s, extraPrice = %s, attriName1 = %s, attriName2 = %s, attriName3 = %s, attriName4 = %s, comment = %s, variety = %s where platformID = %s"
            cursor.execute(sql, (row['title'], row['price'], sale, row['img'], row['url'], row['shopRating'], row['shopName'] , has_mode, has_size, platform, procity, has_type, row['extraPrice'], row['attriName1'], attriName2, attriName3, attriName4, 0 , variety, row['id']))

    connection.commit()
    cursor.close()
    connection.close()

def Tosql_details_tb():
    df = pd.read_csv('tb/data_tb_all.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    for i, row in df.iterrows():
        id_value = row['id']
        platform = 'tm' if row['tmall'] == True else 'tb'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            print(f"error {id_value}")
        else:
            if str(row['attriListName']) == 'nan' or str(row['attriListImg']) == 'nan':
                print(f"ID {id_value} has no attributes. Skipping...")
                continue
            if len(str(row['attriListName']).split(', ')) != len(str(row['attriListImg']).split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            cursor.execute("SELECT id FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
            result = cursor.fetchone()
            now = result[0]
            attriListName = row['attriListName'].split(', ')
            attriListImg = row['attriListImg'].split(', ')

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriListSize = []
            else:
                has_size = True
                attriListSize = row['attriListSize'].split(', ')

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriListMode = []
            else:
                has_mode = True
                attriListMode = row['attriListMode'].split(', ')

            if row['attriName4'] == '' or str(row['attriName4']) == 'nan':
                has_type = False
                attriListType = []
            else:
                has_type = True
                attriListType = row['attriListType'].split(', ')
            
            imgList = row['img_list'].split(', ')
            sql = "DELETE FROM product_img WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_name WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_size WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_mode WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_type WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            for img in imgList:
                sql = "INSERT INTO product_img (product_id, image_url) VALUES (%s, %s)"
                cursor.execute(sql, (now, img))
            
            for (name, img) in zip(attriListName, attriListImg):
                sql = "INSERT INTO product_name (product_id, name, image_url) VALUES (%s, %s, %s)"
                cursor.execute(sql, (now, name, img))
            
            if has_size == True:
                for size in attriListSize:
                    sql = "INSERT INTO product_size (product_id, name) VALUES (%s, %s)"
                    cursor.execute(sql, (now, size))

            if has_mode == True:
                for mode in attriListMode:
                    sql = "INSERT INTO product_mode (product_id, name) VALUES (%s, %s)"
                    cursor.execute(sql, (now, mode))

            if has_type == True:
                for ttype in attriListType:
                    sql = "INSERT INTO product_type (product_id, name) VALUES (%s, %s)"
                    cursor.execute(sql, (now, ttype))

    connection.commit()
    cursor.close()
    connection.close()

def Tosql_price_tb():
    df = pd.read_csv('tb/data_tb_all.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    date = time.strftime("%Y-%m-%d", time.localtime())
    for i, row in df.iterrows():
        id_value = row['id']
        platform = 'tm' if row['tmall'] == True else 'tb'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            print(f"error {id_value}")
        else:
            cursor.execute("SELECT id FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
            result = cursor.fetchone()
            now = result[0]
            cursor.execute("SELECT * FROM product_price_history WHERE product_id = %s ORDER BY price_date DESC", (now, ))
            result = cursor.fetchall()
            if len(result) != 0:
                if str(result[0][3]) == str(date):
                    continue
                if abs(float(result[0][2]) - row['extraPrice']) < 0.005:
                    continue
            sql = "INSERT INTO product_price_history (product_id, price, price_date) VALUES (%s, %s, %s)"
            cursor.execute(sql, (now, row['extraPrice'], date))
            if len(result) != 0 and float(result[0][2]) - row['extraPrice'] > 0.005:
                cursor.execute("SELECT name FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
                result = cursor.fetchone()
                name = result[0]
                cursor.execute("SELECT user_id FROM user_product_favourite WHERE product_id = %s", (now))
                result = cursor.fetchall()
                for user_id in result:
                    sql = 'INSERT INTO user_price_drop_alerts (user_id, product_name, product_url) VALUES (?, ?, ?)'
                    cursor.execute(sql, (user_id, name, f'/product?id={now}'))
                    cursor.execute("SELECT email FROM users WHERE user_id = %s", (user_id[0], ))
                    result = cursor.fetchone()
                    email = result[0]
                    send_email_via_api(email, name)


    connection.commit()
    cursor.close()
    connection.close()

def Tosql_products_jd():

    df = pd.read_csv('jd/data_jd_all.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    for i, row in df.iterrows():
        # if i > 100:
        #     break
        print(i)
        id_value = row['id']            
        platform = 'jd'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            if len(row['attriListName'].split(', ')) != len(row['attriListImg'].split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            if str(row['title'])== 'nan':
                print(f"ID {id_value} has no title. Skipping...")
                continue
            variety = len(row['attriListName'].split(', '))

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriName2 = ''
            else:
                has_size = True
                variety = variety * len(row['attriListSize'].split(', '))
                attriName2 = row['attriName2']

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriName3 = ''
            else:
                has_mode = True
                variety = variety * len(row['attriListMode'].split(', '))
                attriName3 = row['attriName3']
                
            comment = row['comment'].strip().replace('+', '').replace('万', '0000')
            comment = comment if re.fullmatch(r'\d+', comment) else 0
            # 这里有点蠢，由于跑的数据的原因，price和extraPrice会一个有一个没有，懒得改了
            price = row['price'] if str(row['price']) != 'nan' else row['extraPrice']
            extraPrice = row['extraPrice'] if str(row['extraPrice']) != 'nan' else row['price']
            shopRating = row['shopRating'] if str(row['shopRating']) != 'nan' else 5.0

            sql = "INSERT INTO products (name, price, total_sales, image_url, url, shopRating, shopName, has_mode, has_size, platform, procity, has_type, extraPrice, platformID, attriName1, attriName2, attriName3, attriName4, comment, variety) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
            cursor.execute(sql, (row['title'].strip(), price, 0, 'https://img11.360buyimg.com/img/'+row['img'], row['url'], shopRating, row['shopName'].strip() , has_mode, has_size, platform, '', False, extraPrice, row['id'], row['attriName1'].strip(), attriName2.strip(), attriName3.strip(), '', comment , variety))
        else:
            if len(row['attriListName'].split(', ')) != len(row['attriListImg'].split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            if str(row['title'])== 'nan':
                print(f"ID {id_value} has no title. Skipping...")
                continue
            variety = len(row['attriListName'].split(', '))

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriName2 = ''
            else:
                has_size = True
                variety = variety * len(row['attriListSize'].split(', '))
                attriName2 = row['attriName2']

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriName3 = ''
            else:
                has_mode = True
                variety = variety * len(row['attriListMode'].split(', '))
                attriName3 = row['attriName3']
                
            comment = row['comment'].strip().replace('+', '').replace('万', '0000') 
            comment = comment if re.fullmatch(r'\d+', comment) else 0
            price = row['price'] if str(row['price']) != 'nan' else row['extraPrice']
            extraPrice = row['extraPrice'] if str(row['extraPrice']) != 'nan' else row['price']
            shopRating = row['shopRating'] if str(row['shopRating']) != 'nan' else 5.0
            sql = "UPDATE products SET name = %s, price = %s, total_sales = %s, image_url = %s, url = %s, shopRating = %s, shopName = %s, has_mode = %s, has_size = %s, platform = %s, procity = %s, has_type = %s, extraPrice = %s, attriName1 = %s, attriName2 = %s, attriName3 = %s, attriName4 = %s, comment = %s, variety = %s where platformID = %s"
            cursor.execute(sql, (row['title'].strip(), price, 0, 'https://img11.360buyimg.com/img/'+row['img'], row['url'], shopRating, row['shopName'].strip() , has_mode, has_size, platform, '', False, extraPrice, row['attriName1'].strip(), attriName2.strip(), attriName3.strip(), '', comment , variety, row['id']))

    connection.commit()
    cursor.close()
    connection.close()

def Tosql_details_jd():
    df = pd.read_csv('jd/data_jd_all.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    for i, row in df.iterrows():
        id_value = row['id']
        platform = 'jd'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            print(f"error {id_value}")
        else:
            if len(row['attriListName'].split(', ')) != len(row['attriListImg'].split(', ')):
                print(f"ID {id_value} has mismatched attributes. Skipping...")
                continue
            cursor.execute("SELECT id FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
            result = cursor.fetchone()
            now = result[0]
            attriListName = row['attriListName'].split(', ')
            attriListImg = row['attriListImg'].split(', ')

            if row['attriName2'] == '' or str(row['attriName2']) == 'nan':
                has_size = False
                attriListSize = []
            else:
                has_size = True
                attriListSize = row['attriListSize'].split(', ')

            if row['attriName3'] == '' or str(row['attriName3']) == 'nan':
                has_mode = False
                attriListMode = []
            else:
                has_mode = True
                attriListMode = row['attriListMode'].split(', ')
            
            imgList = row['img_list'].split(', ')
            sql = "DELETE FROM product_img WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_name WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_size WHERE product_id = %s;"
            cursor.execute(sql, (now, ))
            sql = "DELETE FROM product_mode WHERE product_id = %s;"
            cursor.execute(sql, (now, ))

            for img in imgList:
                sql = "INSERT INTO product_img (product_id, image_url) VALUES (%s, %s)"
                cursor.execute(sql, (now, 'https://img11.360buyimg.com/img/'+img.strip()))
            
            for (name, img) in zip(attriListName, attriListImg):
                sql = "INSERT INTO product_name (product_id, name, image_url) VALUES (%s, %s, %s)"
                cursor.execute(sql, (now, name.strip(), 'https://img11.360buyimg.com/img/'+img.strip()))
            
            if has_size == True:
                for size in attriListSize:
                    sql = "INSERT INTO product_size (product_id, name) VALUES (%s, %s)"
                    cursor.execute(sql, (now, size.strip()))

            if has_mode == True:
                for mode in attriListMode:
                    sql = "INSERT INTO product_mode (product_id, name) VALUES (%s, %s)"
                    cursor.execute(sql, (now, mode.strip()))

    connection.commit()
    cursor.close()
    connection.close()

def Tosql_price_jd():
    df = pd.read_csv('jd/data_jd_test.csv')

    connection = mysql.connector.connect(
        host='localhost',
        user='pikabi',
        password='1',
        database='pc',
    )

    cursor = connection.cursor()

    date = time.strftime("%Y-%m-%d", time.localtime())
    for i, row in df.iterrows():
        id_value = row['id']
        platform = 'jd'
        cursor.execute("SELECT COUNT(*) FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
        result = cursor.fetchone()
        if result[0] == 0:
            print(f"error {id_value}")
        else:
            cursor.execute("SELECT id FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
            result = cursor.fetchone()
            now = result[0]
            cursor.execute("SELECT * FROM product_price_history WHERE product_id = %s ORDER BY price_date DESC", (now, ))
            result = cursor.fetchall()
            price = row['price'] if str(row['price']) != 'nan' else row['extraPrice']
            extraPrice = row['extraPrice'] if str(row['extraPrice']) != 'nan' else row['price']

            if len(result) != 0:
                if str(result[0][3]) == str(date):
                    continue
                if abs(float(result[0][2]) - extraPrice) < 0.005:
                    continue
            sql = "INSERT INTO product_price_history (product_id, price, price_date) VALUES (%s, %s, %s)"
            cursor.execute(sql, (now, extraPrice, date))

            if len(result) != 0 and float(result[0][2]) - extraPrice > 0.005:
                cursor.execute("SELECT name FROM products WHERE platformID = %s and platform = %s", (id_value, platform))
                result = cursor.fetchone()
                name = result[0]
                cursor.execute("SELECT user_id FROM user_product_favourites WHERE product_id = %s", (now, ))
                result = cursor.fetchall()
                for user_id in result:
                    sql = 'INSERT INTO user_price_drop_alerts (user_id, product_name, product_url) VALUES (%s, %s, %s)'
                    cursor.execute(sql, (user_id[0], name, f'/product?id={now}'))
                    cursor.execute("SELECT unread_messages FROM users WHERE user_id = %s", (user_id[0], ))
                    result = cursor.fetchone()
                    unread_messages = result[0] + 1
                    cursor.execute("UPDATE users SET unread_messages = %s WHERE user_id = %s", (unread_messages, user_id[0]))
                    cursor.execute("SELECT email FROM users WHERE user_id = %s", (user_id[0], ))
                    result = cursor.fetchone()
                    email = result[0]
                    send_email_via_api(email, name)

    connection.commit()
    cursor.close()
    connection.close()

def send_email_via_api(email, name):
    url = 'http://localhost:5000/message/mail'
    payload = {'email': email, 'name': name}
    response = requests.post(url, json=payload)

    if response.status_code == 200:
        print("邮件发送成功:", response.json())
    else:
        print("发送失败:", response.text)

if __name__ == '__main__':
    # Tosql_products_tb()
    # Tosql_details_tb()
    # Tosql_price_tb()
    # Tosql_products_jd()
    # Tosql_details_jd()
    Tosql_price_jd()
