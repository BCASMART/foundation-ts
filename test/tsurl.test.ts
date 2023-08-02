import { TSTest } from "../src/tstester";
import { TSDictionary } from "../src/types";
import { TSURL } from "../src/tsurl";
import { $length } from "../src/commons";

interface URLTestDefinition {
    protocol: string,
    port?:string,
    host: string,
    hostname: string,
    pathname: string,
    search?:string,
    path?: string,
    hash?: string,
    href?: string,
    auth?:string

}

export const TSURLGroups = [
    TSTest.group("Standard parse TSURL", async (group) => {
        const localProtocols = ['svn+ssh:', 'dash-test:', 'dot.test:', 'git+ssh:'] ;

        const parseTests:TSDictionary<URLTestDefinition> = {
          
            'http:\\\\evil-phisher\\foo.html#h\\a\\s\\h': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              path: '/foo.html',
              hash: '#h%5Ca%5Cs%5Ch',
              href: 'http://evil-phisher/foo.html#h%5Ca%5Cs%5Ch'
            },
          
            'http:\\\\evil-phisher\\foo.html?json="\\"foo\\""#h\\a\\s\\h': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              search: '?json=%22%5C%22foo%5C%22%22',
              path: '/foo.html?json=%22%5C%22foo%5C%22%22',
              hash: '#h%5Ca%5Cs%5Ch',
              href: 'http://evil-phisher/foo.html?json=%22%5C%22foo%5C%22%22#h%5Ca%5Cs%5Ch'
            },
          
            'http:\\\\evil-phisher\\foo.html#h\\a\\s\\h?blarg': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              path: '/foo.html',
              hash: '#h%5Ca%5Cs%5Ch?blarg',
              href: 'http://evil-phisher/foo.html#h%5Ca%5Cs%5Ch?blarg'
            },
          
            'http:\\\\evil-phisher\\foo.html': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              path: '/foo.html',
              href: 'http://evil-phisher/foo.html'
            },
          
            'HTTP://www.example.com/': {
              href: 'http://www.example.com/',
              protocol: 'http:',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'HTTP://www.example.com': {
              href: 'http://www.example.com/',
              protocol: 'http:',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://www.ExAmPlE.com/': {
              href: 'http://www.example.com/',
              protocol: 'http:',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://user:pw@www.ExAmPlE.com/': {
              href: 'http://user:pw@www.example.com/',
              protocol: 'http:',
              auth: 'user:pw',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://USER:PW@www.ExAmPlE.com/': {
              href: 'http://USER:PW@www.example.com/',
              protocol: 'http:',
              auth: 'USER:PW',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://user@www.example.com/': {
              href: 'http://user@www.example.com/',
              protocol: 'http:',
              auth: 'user',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://user%3Apw@www.example.com/': {
              href: 'http://user:pw@www.example.com/',
              protocol: 'http:',
              auth: 'user:pw',
              host: 'www.example.com',
              hostname: 'www.example.com',
              pathname: '/',
              path: '/'
            },
          
            'http://x.com/path?that\'s#all, folks': {
              href: 'http://x.com/path?that%27s#all,%20folks',
              protocol: 'http:',
              host: 'x.com',
              hostname: 'x.com',
              search: '?that%27s',
              pathname: '/path',
              hash: '#all,%20folks',
              path: '/path?that%27s'
            },
          
            'HTTP://X.COM/Y': {
              href: 'http://x.com/Y',
              protocol: 'http:',
              host: 'x.com',
              hostname: 'x.com',
              pathname: '/Y',
              path: '/Y'
            },
          
            /*
             * + not an invalid host character
             * per https://url.spec.whatwg.org/#host-parsing
             */
            'http://x.y.com+a/b/c': {
              href: 'http://x.y.com+a/b/c',
              protocol: 'http:',
              host: 'x.y.com+a',
              hostname: 'x.y.com+a',
              pathname: '/b/c',
              path: '/b/c'
            },
          
            // an unexpected invalid char in the hostname.
            'HtTp://x.y.cOm;a/b/c?d=e#f g<h>i': {
              href: 'http://x.y.com/;a/b/c?d=e#f%20g%3Ch%3Ei',
              protocol: 'http:',
              host: 'x.y.com',
              hostname: 'x.y.com',
              pathname: ';a/b/c',
              search: '?d=e',
              hash: '#f%20g%3Ch%3Ei',
              path: ';a/b/c?d=e'
            },
          
            // make sure that we don't accidentally lcast the path parts.
            'HtTp://x.y.cOm;A/b/c?d=e#f g<h>i': {
              href: 'http://x.y.com/;A/b/c?d=e#f%20g%3Ch%3Ei',
              protocol: 'http:',
              host: 'x.y.com',
              hostname: 'x.y.com',
              pathname: ';A/b/c',
              search: '?d=e',
              hash: '#f%20g%3Ch%3Ei',
              path: ';A/b/c?d=e'
            },
          
            'http://x...y...#p': {
              href: 'http://x...y.../#p',
              protocol: 'http:',
              host: 'x...y...',
              hostname: 'x...y...',
              hash: '#p',
              pathname: '/',
              path: '/'
            },
          
            'http://x/p/"quoted"': {
              href: 'http://x/p/%22quoted%22',
              protocol: 'http:',
              host: 'x',
              hostname: 'x',
              pathname: '/p/%22quoted%22',
              path: '/p/%22quoted%22'
            },
          
          
            'http://www.narwhaljs.org/blog/categories?id=news': {
              href: 'http://www.narwhaljs.org/blog/categories?id=news',
              protocol: 'http:',
              host: 'www.narwhaljs.org',
              hostname: 'www.narwhaljs.org',
              search: '?id=news',
              pathname: '/blog/categories',
              path: '/blog/categories?id=news'
            },
          
            'http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=': {
              href: 'http://mt0.google.com/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=',
              protocol: 'http:',
              host: 'mt0.google.com',
              hostname: 'mt0.google.com',
              pathname: '/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s=',
              path: '/vt/lyrs=m@114&hl=en&src=api&x=2&y=2&z=3&s='
            },
          
            'http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=': {
              href: 'http://mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=',
              protocol: 'http:',
              host: 'mt0.google.com',
              hostname: 'mt0.google.com',
              search: '???&hl=en&src=api&x=2&y=2&z=3&s=',
              pathname: '/vt/lyrs=m@114',
              path: '/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s='
            },
          
            'http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=': {
              href: 'http://user:pass@mt0.google.com/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s=',
              protocol: 'http:',
              host: 'mt0.google.com',
              auth: 'user:pass',
              hostname: 'mt0.google.com',
              search: '???&hl=en&src=api&x=2&y=2&z=3&s=',
              pathname: '/vt/lyrs=m@114',
              path: '/vt/lyrs=m@114???&hl=en&src=api&x=2&y=2&z=3&s='
            },
          
            'file:///etc/passwd': {
                href: 'file://localhost/etc/passwd',
                protocol: 'file:',
                pathname: '/etc/passwd',
                hostname: 'localhost',
                host: 'localhost',
                path: '/etc/passwd'
              },

            'file://localhost/etc/passwd': {
              href: 'file://localhost/etc/passwd',
              protocol: 'file:',
              pathname: '/etc/passwd',
              hostname: 'localhost',
              host: 'localhost',
              path: '/etc/passwd'
            },
          
            'file://foo/etc/passwd': {
              href: 'file://foo/etc/passwd',
              protocol: 'file:',
              pathname: '/etc/passwd',
              hostname: 'foo',
              host: 'foo',
              path: '/etc/passwd'
            },
          
            'file:///etc/node/': {
                href: 'file://localhost/etc/node/',
                protocol: 'file:',
                pathname: '/etc/node/',
                hostname: 'localhost',
                host: 'localhost',
                path: '/etc/node/'
              },
          
            'file://localhost/etc/node/': {
              href: 'file://localhost/etc/node/',
              protocol: 'file:',
              pathname: '/etc/node/',
              hostname: 'localhost',
              host: 'localhost',
              path: '/etc/node/'
            },
          
            'file://foo/etc/node/': {
              href: 'file://foo/etc/node/',
              protocol: 'file:',
              pathname: '/etc/node/',
              hostname: 'foo',
              host: 'foo',
              path: '/etc/node/'
            },
                    
            'http://user:pass@example.com:8000/foo/bar?baz=quux#frag': {
              href: 'http://user:pass@example.com:8000/foo/bar?baz=quux#frag',
              protocol: 'http:',
              host: 'example.com:8000',
              auth: 'user:pass',
              port: '8000',
              hostname: 'example.com',
              hash: '#frag',
              search: '?baz=quux',
              pathname: '/foo/bar',
              path: '/foo/bar?baz=quux'
            },
                    
          
            'http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar': {
              href: 'http://atpass:foo%40bar@127.0.0.1:8080/path?search=foo#bar',
              protocol: 'http:',
              host: '127.0.0.1:8080',
              auth: 'atpass:foo@bar',
              hostname: '127.0.0.1',
              port: '8080',
              pathname: '/path',
              search: '?search=foo',
              hash: '#bar',
              path: '/path?search=foo'
            },
          
            'svn+ssh://foo/bar': {
              href: 'svn+ssh://foo/bar',
              host: 'foo',
              hostname: 'foo',
              protocol: 'svn+ssh:',
              pathname: '/bar',
              path: '/bar',
            },
          
            'dash-test://foo/bar': {
              href: 'dash-test://foo/bar',
              host: 'foo',
              hostname: 'foo',
              protocol: 'dash-test:',
              pathname: '/bar',
              path: '/bar',
            },
                    
            'dot.test://foo/bar': {
              href: 'dot.test://foo/bar',
              host: 'foo',
              hostname: 'foo',
              protocol: 'dot.test:',
              pathname: '/bar',
              path: '/bar',
            },
                    
          
            // empty port
            'http://example.com:': {
              protocol: 'http:',
              host: 'example.com',
              hostname: 'example.com',
              href: 'http://example.com/',
              pathname: '/',
              path: '/'
            },
          
            'http://example.com:/a/b.html': {
              protocol: 'http:',
              host: 'example.com',
              hostname: 'example.com',
              href: 'http://example.com/a/b.html',
              pathname: '/a/b.html',
              path: '/a/b.html'
            },
          
            'http://example.com:?a=b': {
              protocol: 'http:',
              host: 'example.com',
              hostname: 'example.com',
              href: 'http://example.com/?a=b',
              search: '?a=b',
              pathname: '/',
              path: '/?a=b'
            },
          
            'http://example.com:#abc': {
              protocol: 'http:',
              host: 'example.com',
              hostname: 'example.com',
              href: 'http://example.com/#abc',
              hash: '#abc',
              pathname: '/',
              path: '/'
            },
          
            'http://[fe80::1]:/a/b?a=b#abc': {
              protocol: 'http:',
              host: '[fe80::1]',
              hostname: 'fe80::1',
              href: 'http://[fe80::1]/a/b?a=b#abc',
              search: '?a=b',
              hash: '#abc',
              pathname: '/a/b',
              path: '/a/b?a=b'
            },
          
            'http://-lovemonsterz.tumblr.com/rss': {
              protocol: 'http:',
              host: '-lovemonsterz.tumblr.com',
              hostname: '-lovemonsterz.tumblr.com',
              href: 'http://-lovemonsterz.tumblr.com/rss',
              pathname: '/rss',
              path: '/rss'
            },
          
            'http://-lovemonsterz.tumblr.com:80/rss': {
              protocol: 'http:',
              port: '80',
              host: '-lovemonsterz.tumblr.com:80',
              hostname: '-lovemonsterz.tumblr.com',
              href: 'http://-lovemonsterz.tumblr.com:80/rss',
              pathname: '/rss',
              path: '/rss'
            },
          
            'http://user:pass@-lovemonsterz.tumblr.com/rss': {
              protocol: 'http:',
              auth: 'user:pass',
              host: '-lovemonsterz.tumblr.com',
              hostname: '-lovemonsterz.tumblr.com',
              href: 'http://user:pass@-lovemonsterz.tumblr.com/rss',
              pathname: '/rss',
              path: '/rss'
            },
          
            'http://user:pass@-lovemonsterz.tumblr.com:80/rss': {
              protocol: 'http:',
              auth: 'user:pass',
              port: '80',
              host: '-lovemonsterz.tumblr.com:80',
              hostname: '-lovemonsterz.tumblr.com',
              href: 'http://user:pass@-lovemonsterz.tumblr.com:80/rss',
              pathname: '/rss',
              path: '/rss'
            },
          
            'http://_jabber._tcp.google.com/test': {
              protocol: 'http:',
              host: '_jabber._tcp.google.com',
              hostname: '_jabber._tcp.google.com',
              href: 'http://_jabber._tcp.google.com/test',
              pathname: '/test',
              path: '/test'
            },
          
            'http://user:pass@_jabber._tcp.google.com/test': {
              protocol: 'http:',
              auth: 'user:pass',
              host: '_jabber._tcp.google.com',
              hostname: '_jabber._tcp.google.com',
              href: 'http://user:pass@_jabber._tcp.google.com/test',
              pathname: '/test',
              path: '/test'
            },
          
            'http://_jabber._tcp.google.com:80/test': {
              protocol: 'http:',
              port: '80',
              host: '_jabber._tcp.google.com:80',
              hostname: '_jabber._tcp.google.com',
              href: 'http://_jabber._tcp.google.com:80/test',
              pathname: '/test',
              path: '/test'
            },
          
            'http://user:pass@_jabber._tcp.google.com:80/test': {
              protocol: 'http:',
              auth: 'user:pass',
              port: '80',
              host: '_jabber._tcp.google.com:80',
              hostname: '_jabber._tcp.google.com',
              href: 'http://user:pass@_jabber._tcp.google.com:80/test',
              pathname: '/test',
              path: '/test'
            },
          
            'http://x:1/\' <>"`/{}|\\^~`/': {
              protocol: 'http:',
              host: 'x:1',
              port: '1',
              hostname: 'x',
              pathname: '/%27%20%3C%3E%22%60/%7B%7D%7C/%5E~%60/',
              path: '/%27%20%3C%3E%22%60/%7B%7D%7C/%5E~%60/',
              href: 'http://x:1/%27%20%3C%3E%22%60/%7B%7D%7C/%5E~%60/'
            },
          
            'http://a@b@c/': {
              protocol: 'http:',
              auth: 'a@b',
              host: 'c',
              hostname: 'c',
              href: 'http://a%40b@c/',
              path: '/',
              pathname: '/'
            },
          
            'http://a@b?@c': {
              protocol: 'http:',
              auth: 'a',
              host: 'b',
              hostname: 'b',
              href: 'http://a@b/?@c',
              path: '/?@c',
              pathname: '/',
              search: '?@c',
            },
          
            'http://a\r" \t\n<\'b:b@c\r\nd/e?f': {
              protocol: 'http:',
              auth: 'a\r" \t\n<\'b:b',
              host: 'c',
              hostname: 'c',
              search: '?f',
              pathname: '%0D%0Ad/e',
              path: '%0D%0Ad/e?f',
              href: 'http://a%0D%22%20%09%0A%3C\'b:b@c/%0D%0Ad/e?f'
            },
            
          
            /*// git urls used by npm
            'git+ssh://git@github.com:npm/npm': {
              protocol: 'git+ssh:',
              auth: 'git',
              host: 'github.com',
              hostname: 'github.com',
              pathname: '/:npm/npm',
              path: '/:npm/npm',
              href: 'git+ssh://git@github.com/:npm/npm'
            }*/
          
        };
        Object.entries(parseTests).forEach(([url, res]) => {
            group.unary(`Parsing url '${url}'`, async (t) => {
                const u = TSURL.url(url, { acceptedProtocols:localProtocols }) ;
                if (t.expect0(u).OK()) {
                    t.expect1(u?.protocol).is(res.protocol) ;
                    t.expect2(u?.hostname).is(res.hostname) ;
                    t.expect3(u?.host).is(res.host) ;
                    t.expect4(u?.pathname).is(res.pathname) ;
                    t.register('hostname', u?.hostname) ;
                    t.register('host', u?.host) ;
                    t.register('pathname', u?.pathname) ;
                    t.expect5(u?.href).is(res.href) ;
                    if ($length(res.auth)) {
                        t.expectA(u?.auth).is(res.auth)
                    }
                    if ($length(res.hash)) {
                        t.expectB(u?.hash).is(res.hash)
                    }
                    if ($length(res.search)) {
                        t.expectC(u?.search).is(res.search)
                    }
                }
            })
        })  
    })
] ;

