#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <libgen.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <mach-o/dyld.h> /* _NSGetExecutablePath */

#define MAX_BUFFER          256
#define PORT                8090

static char* ok_response =
    "HTTP/1.1 200 OK\n"
    "Content-type: text/html\n"
    "\n";

int getdirname(char* buffer, size_t* size) {
    uint32_t usize;
    int result;
    char* path;

    usize = *size;
    result = _NSGetExecutablePath(buffer, &usize);
    if (result) return result;

    path = (char*)malloc(2 * 1024);
    memset(path, 0, 2 * 1024);
    realpath(buffer, path);

    strncpy(buffer, dirname(path), *size);
    free(path);
    *size = strlen(buffer);
    return 0;
}

int main() {
    int serverFd, connectionFd;
    struct sockaddr_in servaddr;

    serverFd = socket(AF_INET, SOCK_STREAM, 0);

    memset(&servaddr, 0, sizeof(servaddr));
    servaddr.sin_family = AF_INET;
    servaddr.sin_addr.s_addr = htonl(INADDR_ANY);
    servaddr.sin_port = htons(PORT);

    bind(serverFd, (struct sockaddr *)&servaddr, sizeof(servaddr));
    listen(serverFd, 5);

    while (1) {
        connectionFd = accept(serverFd, (struct sockaddr *)NULL, NULL);
        if (connectionFd > 0) {
            char buffer[MAX_BUFFER];
            ssize_t bytes_read;
            bytes_read = read(connectionFd, buffer, sizeof(buffer) - 1);
            if (bytes_read <= 0) {
                printf("bytes_read is 0\n");
                continue;
            }
            buffer[bytes_read] = '\0';
            printf("%s\n\n", buffer);

            char method[MAX_BUFFER];
            char url[MAX_BUFFER];
            char protocol[MAX_BUFFER];
            sscanf(buffer, "%s %s %s", method, url, protocol);

            if (strcmp(url, "/favicon.ico") == 0) continue;

            char dirname[512];
            size_t size = 512;
            getdirname(dirname, &size);

            char *filepath;
            filepath = strcat(dirname, url);

            char *buf;
            FILE *fp = fopen(filepath, "r");
            if (!fp) {
                char *not = "Not Found";
                buf = (char*)malloc(512);
                strcat(buf, ok_response);
                strcat(buf, not);
            } else {
                struct stat stat_buf;
                fstat(fileno(fp), &stat_buf);
                int filesize = stat_buf.st_size;
                int memsize = filesize + strlen(ok_response);
                buf = (char*)malloc(memsize + 1);
                strcpy(buf, ok_response);
                /* while ((fgets(buf + strlen(buf), 200, fp)) != NULL); */
                fread(buf + strlen(ok_response), 1, filesize, fp);
                buf[memsize] = 0;
            }
            fclose(fp);

            send(connectionFd, buf, strlen(buf), 0);
            free(buf);
            close(connectionFd);
        }
    }
}
