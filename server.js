const express = require('express');
const fs = require("fs");
const os = require('os');
const cons = require('consolidate');
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.engine('html', cons.hogan);
app.set('view engine', 'html');
app.set('views', __dirname + '/templates');

var chromeProfileDirWin = os.homedir()+'/AppData/Local/Google/Chrome/User Data/Default/';
var chromiumProfileDirLinux = os.homedir()+'/.config/chromium/Default/';
var profileDir = process.platform === 'win32' ? chromeProfileDirWin : chromiumProfileDirLinux;

var iconCache = {};

function getBookmarkData(){
    let data = JSON.parse(fs.readFileSync(profileDir+"Bookmarks"));
    let items = data.roots.other.children;
    let folders = items.filter(item => item.type == "folder");
    let urls = items.filter(item => item.type == "url");

    if(urls.length>0){
        folders.push({
            name:"Uncategorised",
            children: urls
        });
    }

    return folders;
}

function readAllFavicons(){
    fs.copyFileSync(profileDir+"Favicons","Favicons");
    iconCache = {};
    iconCache.default = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAoklEQVR4AU3PMcqDQBQE4HeZOY12NjYeIJJ4AnObYJN0Kr9eyTqgbiZvsiD6O82w34OFMYp0OeWxSJlEUTzKtqbCFej/wecCdY42graUaLTkOOCD/rXojgikRIW/BM8HbnSjpJVTirRFMYsmhhJDgmREGRiB8f823qdvfDrdVKHpkA7UFhNqha7HugORvdngsk8yjshqFOG0ZQSqwBOIx1anfpH8zz6kV+6TAAAAAElFTkSuQmCC", 'base64');

    let db = new sqlite3.Database("Favicons", sqlite3.OPEN_READONLY);

    db.serialize(() => {
        db.each("select m.page_url, b.image_data from favicon_bitmaps as b join icon_mapping as m on m.icon_id = b.icon_id where b.width=16;", (err,row) =>{
            iconCache[row.page_url] = row.image_data;
        });
    });

    db.close();
}

app.get("/", (req,res) => {
    res.render('app', { 
        name: os.userInfo().username.replace("."," "), 
        dayOfWeek: new Date().toLocaleString('en-gb', {weekday:'long'}).toLowerCase(), 
        date: new Date().toDateString() 
    });
});

app.get("/favicon", (req,res) => {
    let url = req.query.url;
    res.set('Content-Type', 'image/png');

    if (url in iconCache) {
        res.send(iconCache[url]);
    } else {
        res.send(iconCache["default"]);
    }
});

app.get("/json", (req,res) => {
    let folders = getBookmarkData();
    let data = [];

    folders.forEach(folder => {
        let group = {
            group: folder.name,
            name: folder.name,
            bookmarks: []
        };

        folder.children.filter(c => c.type == 'url').forEach(child => {
            let favicon = child.url in iconCache ? iconCache[child.url]: iconCache.default;
            group.bookmarks.push({
                name: child.name,
                url: child.url,
                favicon: "data:image/gif;base64,"+Buffer.from(favicon).toString('base64')
            });
        });

        data.push(group);
    });

    res.send(data);
});

readAllFavicons();
app.use('/static', express.static('static'))

app.listen(9000, () => {
});
