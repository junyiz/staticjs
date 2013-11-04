#!/usr/bin/env node

var PORT = process.argv[2] || 8090;
// 根目录默认为当前目录
var dir = process.argv[2];
var ROOT = dir ? dir : process.cwd();
var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
var MIME = {
    'htm':  'text/html',
    'html': 'text/html',
    'css':  'text/css',
    'js':   'text/javascript',
    'txt':  'text/plain',
    'json': 'text/plain',
    'gif':  'image/gif',
    'ico':  'image/x-icon',
    'jpg':  'image/jpeg',
    'png':  'image/png',
    'rar':  'application/x-rar-compressed',
    'jar':  'application/java-archive'
};
this.$_GET = {};
this.$_POST = {};

// javascript-micro-templating
function tmpl(html) {
    if (html.indexOf('<%') === -1) return html;
    var fn = new Function("var p=[];p.push('" +
        // 语法分析：将模板转化为纯粹的JavaScript
        html.replace(/[\r\t\n](?=[^%]*%>)/g, " ")
            .replace(/\r/g, "__ENTER__")
            .replace(/\t/g, "__TAB__")
            .replace(/\n/g, "__NEWLINE__")
            .replace(/'(?=[^%]*%>)/g,"__SINGLE_QUOTE__")
            .split("'").join("\\'")
            .split("__SINGLE_QUOTE__").join("'")
            .replace(/<%=(.+?)%>/g, "',$1,'")
            .split("<%").join("');")
            .split("%>").join("p.push('")
        + "');return p.join('');");
    return fn().replace(/__ENTER__/g, "\r").replace(/__TAB__/g, "\t").replace(/__NEWLINE__/g, "\n");
}

function queryStringToObj(str) {
    var obj = {};
    str.replace(/([^?=&]+)(=([^&]*))?/g, function ($0, $1, $2, $3) {
        obj[$1] = $3 || '';
    });
    return obj;
}

http.createServer(function(request, response) {
    if (request.method === 'POST') {
        request.setEncoding('utf8');
        request.addListener('data', function(data) {
            $_POST = queryStringToObj(data);
        })
    } else if (request.method === 'GET') {
        $_POST = {};
    }

    var urlObj = url.parse(request.url, true);
    $_GET = urlObj.query;

    var pathname = urlObj.pathname;
    var realpath = ROOT + pathname;
    // 得到扩展名
    var extname = path.extname(realpath).slice(1);
    // 设置默认的MIME
    var contentType = 'text/plain';
    if (extname && MIME[extname]) {
        contentType = MIME[extname];
    }

    // 判断文件是否存在
    fs.exists(realpath, function(exists) {
        if (exists) {
            // 读取文件元信息
            fs.stat(realpath, function(err, stats) {
                if (err) {
                    response.writeHead(500, {'Content-Type': 'text/plain'});
                    response.end(err);
                }
                if (stats.isDirectory()) { // 是目录，则列出目录
                    fs.readFile(realpath + 'index.html', 'utf8', function(err, data) {
                        if (err) {
                            fs.readdir(realpath, function(err, files) {
                                if (err) {
                                    response.writeHead(500, {'Content-Type': 'text/plain'});
                                    response.end(err);
                                }
                                var list = '';
                                files.forEach(function(file) {
                                    list += '<a href="' + path.join(pathname, file) + '">' + file + '</a><br />';
                                });
                                response.writeHead(200, {'Content-Type': 'text/html'});
                                response.write(list);
                                response.end();
                            });
                        } else {
                            response.writeHead(200, {'Content-Type': MIME['html']});
                            response.write(data ? tmpl(data) : '');
                            response.end();
                        }
                    });
                } else { // 是文件，则读取文件
                    var isHtml = extname === 'html';
                    fs.readFile(realpath, isHtml ? 'utf8' : null, function(err, data) {
                        if (err) {
                            response.writeHead(500, {'Content-Type': 'text/plain'});
                            response.end(err);
                        }
                        response.writeHead(200, {'Content-Type': contentType});
                        response.write(isHtml && data ? tmpl(data) : data);
                        response.end();
                    });
                }
            });
        } else {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.write('Not Found');
            response.end();
        }
    });
}).listen(PORT);

console.log('static file server runing at port: ' + PORT + '.');