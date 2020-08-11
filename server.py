import json
import sqlite3
import base64
import os
import urllib
from markupsafe import Markup
from shutil import copyfile
from flask import Flask, render_template, request
from os.path import expanduser
from datetime import datetime
app = Flask(__name__, static_folder="static")

iconCache = {}
iconCache["default"] = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAoklEQVR4AU3PMcqDQBQE4HeZOY12NjYeIJJ4AnObYJN0Kr9eyTqgbiZvsiD6O82w34OFMYp0OeWxSJlEUTzKtqbCFej/wecCdY42graUaLTkOOCD/rXojgikRIW/BM8HbnSjpJVTirRFMYsmhhJDgmREGRiB8f823qdvfDrdVKHpkA7UFhNqha7HugORvdngsk8yjshqFOG0ZQSqwBOIx1anfpH8zz6kV+6TAAAAAElFTkSuQmCC")


@app.template_filter('urlencode')
def urlencode_filter(s):
    if type(s) == 'Markup':
        s = s.unescape()
    s = s.encode('utf8')
    s = urllib.parse.quote(s)
    return Markup(s)


@app.template_filter('servername')
def getRootPath(url):
    splits = url.split("/")

    if(splits[2] == "modulrfinance.atlassian.net"):
        if len(splits) > 5:
            return "%s//%s/%s/%s/%s" % (splits[0], splits[2], splits[3], splits[4], splits[5])
        elif len(splits) > 4:
            return "%s//%s/%s/%s" % (splits[0], splits[2], splits[3], splits[4])
        elif len(splits) > 3:
            return "%s//%s/%s" % (splits[0], splits[2], splits[3])

    return "%s//%s" % (splits[0], splits[2])


@app.route('/')
@app.route('/index')
def index():
    folders = []
    with open(expanduser("~")+'\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks') as json_file:
        data = json.load(json_file)
        items = data["roots"]["other"]["children"]
        for item in items:
            if item["type"] == "folder":
                folders.append(item)
    return render_template("homepage.html", folders=folders, dayOfWeek=datetime.today().strftime('%A').lower())


@app.route("/favicon")
def favicon():
    url = request.args.get("url")
    image = None

    if url in iconCache:
        image = iconCache[url]
        print("getting image from cache: "+url)
    else:
        sqliteConnection = sqlite3.connect('Favicons')
        cursor = sqliteConnection.cursor()
        cursor.execute(
            "select image_data from favicon_bitmaps where width=16 and icon_id in (select icon_id from icon_mapping where page_url like '"+url+"%' limit 1);")
        row = cursor.fetchone()

        if row is not None:
            image = row[0]
        else:
            image = iconCache["default"]

        cursor.close()
        sqliteConnection.close()
        iconCache[url] = image

    return image


copyfile(expanduser("~")+"\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Favicons",
         os.getcwd()+"\\Favicons")
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.run(host='127.0.0.1', port=9000)
