staticjs
========

一个小巧的静态文件服务器，自带微型模板引擎，支持像PHP/ASP一样写JavaScript

#### 安装
```bash
$ sudo npm install static-js -g
```

#### 模板语法
```
<%
function double(n) {
    return n * 2;
}
for (var i = 0; i < 3; i++) {
%>
    <h1><%= double(i) %></h2>
<% } %>
<p>queryString: <%= $_GET['x'] %></p>
<form method="POST">
    username: <input name="user" type="text" value="<%= $_POST['user'] %>">
    <input type="submit" value="submit">
</form>
```
$_GET, $_POST模仿自PHP的两个索引数组。

#### 启动
```bash
$ staticjs 8090
```
在浏览器器中访问：http://localhost:8090
