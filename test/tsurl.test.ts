import { TSTest } from "../src/tstester";
import { Same, TSDictionary } from "../src/types";
import { TSURL } from "../src/tsurl";
import { $length } from "../src/commons";
import { TSError } from "../src/tserrors";

/**
 * Since this tests are inspired from the node-url package by defunctzombie
 * (https://github.com/defunctzombie/node-url.git),
 * here is the copyright notice included in the test/index.js original file :
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to permit
 * persons to whom the Software is furnished to do so, subject to the
 * following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */

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
              hash: '#h\\a\\s\\h',                             // URL keeps the backslashes of the hash
              href: 'http://evil-phisher/foo.html#h\\a\\s\\h'
            },
          
            'http:\\\\evil-phisher\\foo.html?json="\\"foo\\""#h\\a\\s\\h': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              search: '?json=%22\\%22foo\\%22%22',              // URL keeps the backslashes of the search
              path: '/foo.html?json=%22\\%22foo\\%22%22',
              hash: '#h\\a\\s\\h',
              href: 'http://evil-phisher/foo.html?json=%22\\%22foo\\%22%22#h\\a\\s\\h'
            },
          
            'http:\\\\evil-phisher\\foo.html#h\\a\\s\\h?blarg': {
              protocol: 'http:',
              host: 'evil-phisher',
              hostname: 'evil-phisher',
              pathname: '/foo.html',
              path: '/foo.html',
              hash: '#h\\a\\s\\h?blarg',
              href: 'http://evil-phisher/foo.html#h\\a\\s\\h?blarg'
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
              pathname: "/'%20%3C%3E%22%60/%7B%7D|/%5E~%60/",        // the standard does not escape ' and | in a path
              path: "/'%20%3C%3E%22%60/%7B%7D|/%5E~%60/",
              href: "http://x:1/'%20%3C%3E%22%60/%7B%7D|/%5E~%60/"
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
              auth: 'a" <\'b:b',                                   // URL removes the tabs and new lines
              host: 'cd',
              hostname: 'cd',
              search: '?f',
              pathname: '/e',
              path: '/e?f',
              href: 'http://a%22%20%3C\'b:b@cd/e?f'
            },
            
            // git urls used by npm
            'git+ssh://git@github.com:npm/npm': {
              protocol: 'git+ssh:',
              auth: 'git',
              host: 'github.com',
              hostname: 'github.com',
              pathname: '/:npm/npm',
              path: '/:npm/npm',
              href: 'git+ssh://git@github.com/:npm/npm'
            }
          
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
    }),

    TSTest.group("TSURL — accessors, setters, TSObject conformance", async (group) => {
        const U = 'https://user:pw@example.com:8443/a/b?x=1&y=2#frag' ;

        group.unary('read accessors', async (t) => {
            const u = TSURL.url(U)! ;
            t.expect0(u.href).is(U) ;
            t.expect1(u.w3c).true() ;
            t.expect2(u.origin).is('https://example.com:8443') ;
            t.expect3(u.host).is('example.com:8443') ;
            t.expect4(u.hostname).is('example.com') ;
            t.expect5(u.port).is('8443') ;
            t.expect6(u.protocol).is('https:') ;
            t.expect7(u.auth).is('user:pw') ;
            t.expect8(u.hash).is('#frag') ;
            t.expect9(u.search).is('?x=1&y=2') ;
            t.expectA(u.pathname).is('/a/b') ;
            t.expectB(u.searchParams.get('y')).is('2') ;
            t.expectC(u.toString()).is(U) ;
            t.expectD(`${u}`).is(U) ;                          // Symbol.toPrimitive
            t.expectE(TSURL.url('file:///tmp/x')!.w3c).true() ;
        }) ;

        group.unary('setters rebuild href', async (t) => {
            const u = TSURL.url('https://example.com/p')! ;
            u.pathname = '/new/path' ;
            t.expect0(u.pathname).is('/new/path') ;
            t.expect1(u.href).is('https://example.com/new/path') ;
            u.pathname = '  bad path{}' ;                      // unsafe chars escaped
            t.expect2(u.pathname.includes('%20')).true() ;
            u.pathname = '' ;
            t.expect3(u.pathname).is('/') ;                    // empty -> "/"
            u.port = '9000' ;
            t.expect4(u.port).is('9000') ;
            t.expect5(u.href.includes(':9000/')).true() ;
            u.protocol = 'http:' ;
            t.expect6(u.protocol).is('http:') ;
            t.expect7(u.href.startsWith('http://')).true() ;
            t.expect8(() => { u.protocol = 'ht!tp' ; }).throws(/Impossible to set new protocol/) ;
        }) ;

        group.unary('non-ASCII characters are percent-encoded like the URL class does', async (t) => {
            // they used to be kept as they were in the path, the search and the hash
            const sources = [
                'https://a.com/café/menu',
                'https://a.com/日本',
                'https://a.com/x?q=été&r=日#frag-é',
                'https://a.com/😀?e=😀#😀',
                'https://a.com/x\uD800y',          // lone surrogate -> U+FFFD
                'https://café.fr/été',
                'https://a.com/caf%C3%A9',          // already encoded: unchanged
            ] ;
            sources.forEach((s, i) => { t.expect(TSURL.url(s)?.href, `src${i}`).is(new URL(s).href) ; }) ;
            t.expect0(TSURL.url('https://a.com/café')?.pathname).is('/caf%C3%A9') ;
            t.expect1(TSURL.url('https://a.com/café')!.isEqual(TSURL.url('https://a.com/caf%C3%A9'))).true() ;
            const u = TSURL.url('https://a.com/')! ;
            u.pathname = '/dossier été/f?.txt' ;
            t.expect2(u.href).is('https://a.com/dossier%20%C3%A9t%C3%A9/f%3F.txt') ;
        }) ;

        group.unary('each url part is escaped like the URL class does', async (t) => {
            // all the ASCII characters, in each part, for a standard and a non standard protocol.
            // The parts used to be escaped with the same set of characters (eg. ' and | were escaped in a path),
            // tabs and new lines were escaped instead of being removed, and backslashes were replaced in searches.
            // The URL class of the engines do not all follow the current standard on 3 cases: '^' in a path
            // (escaped since 2024, not yet by Node), '|' in a path and "'" in a non standard search (escaped by 
            // Chrome only). These cases are not compared to the engine, and are checked below.
            const parts = [(c:string) => `/x${c}y`, (c:string) => `/?x${c}y`, (c:string) => `/#x${c}y`, (c:string) => `/x${c}y?a=1`, (c:string) => `/x${c}y#h`] ;
            const differences:string[] = [] ;
            let total = 0 ;
            for (const [origin, opts] of [['https://a.com', {}], ['foo://a.com', { acceptedProtocols:['foo:'] }]] as [string, any][]) {
                for (const [index, part] of parts.entries()) {
                    for (let i = 0 ; i < 0x80 ; i++) {
                        const c = String.fromCodePoint(i) ;
                        const source = origin + part(c) ;
                        if (c === '^' || c === '|' || (c === "'" && origin.startsWith('foo:') && index === 1)) { continue ; } // index 1 is the search
                        let expected:string|undefined = undefined ;
                        try { expected = new URL(source).href ; } catch { expected = undefined ; }
                        if (TSURL.url(source, opts)?.href !== expected) { differences.push(source) ; }
                        total++ ;
                    }
                }
            }
            t.expect0(total).is(1259) ;
            t.expect1(differences).is([]) ;
            t.expect2(TSURL.url("https://a.com/l'a?q=l'a#l'a")?.href).is("https://a.com/l'a?q=l%27a#l'a") ;
            t.expect4(TSURL.url("https://a.com/a^b|c?d^e|f#g^h|i")?.href).is("https://a.com/a%5Eb|c?d^e|f#g^h|i") ;
            t.expect5(TSURL.url("foo://a.com/a?l'a", { acceptedProtocols:['foo:'] })?.href).is("foo://a.com/a?l'a") ;
            const u = TSURL.url('https://a.com/')! ;
            u.pathname = "/l'a b?#" ;
            t.expect3(u.href).is("https://a.com/l'a%20b%3F%23") ;
        }) ;

        group.unary('utf8Href decodes what can be shown without ambiguity', async (t) => {
            const h = (s:string) => TSURL.url(s)?.utf8Href ;
            t.expect0(h('https://café.fr/été/menu?q=日本&x=a%20b#frag-é')).is('https://café.fr/été/menu?q=日本&x=a%20b#frag-é') ;
            t.expect1(TSURL.url('https://café.fr/été')?.href).is('https://xn--caf-dma.fr/%C3%A9t%C3%A9') ; // href stays encoded
            t.expect2(h('https://a.com/%c3%a9/%F0%9F%98%80')).is('https://a.com/é/😀') ;
            t.expect3(h('https://user:p%C3%A9@a.com/')).is('https://user:pé@a.com/') ;
            t.expect4(h('https://[::1]:8080/%C3%A9')).is('https://[::1]:8080/é') ;
            // encoded ASCII characters keep their meaning
            t.expect5(h('https://a.com/a%2Fb%3Fc%23d%25e%20f')).is('https://a.com/a%2Fb%3Fc%23d%25e%20f') ;
            // invalid sequences : truncated, invalid byte, surrogate, overlong form
            t.expect6(h('https://a.com/%C3/%FF%E9/%ED%A0%80/%C0%AF')).is('https://a.com/%C3/%FF%E9/%ED%A0%80/%C0%AF') ;
            // invisible and bidirectional characters stay encoded (no-break space, RTL override, zero width space)
            t.expect7(h('https://a.com/%C2%A0x%E2%80%AEy%E2%80%8Bz')).is('https://a.com/%C2%A0x%E2%80%AEy%E2%80%8Bz') ;
            // punycode hostnames (RFC 3492 samples) and a label which cannot be decoded
            t.expect8(h('https://xn--egbpdaj6bu4bxfgehfvwxn.com/')).is('https://ليهمابتكلموشعربي؟.com/') ;
            t.expect9(h('https://xn--ihqwcrb4cv8a8dqg056pqjye.com/')).is('https://他们为什么不说中文.com/') ;
            t.expectA(h('https://xn--zz.com/')).is('https://xn--zz.com/') ;
        }) ;

        group.unary('internationalized hostnames are converted to punycode', async (t) => {
            // they used to be transliterated, which gave another domain (eg. 'munchen.de' for 'münchen.de')
            const idns = ['https://münchen.de/x', 'https://éxample.fr', 'https://日本.jp', 'https://ДОМЕН.рф/путь', 'https://straße.de',
                          'https://exa😀mple.com', 'https://ｆｕｌｌ.com', 'http://user@münchen.de:8080/p?q=1#h'] ;
            idns.forEach((s, i) => {
                const u = TSURL.url(s) ;
                const n = new URL(s) ;
                t.expect(u?.hostname, `idn${i}`).is(n.hostname) ;                // same conversion as the native URL class
                t.expect(u?.origin, `orig${i}`).is(n.origin) ;
            }) ;
            t.expect0(TSURL.url('https://münchen.de')?.hostname).is('xn--mnchen-3ya.de') ;
            // invalid internationalized hostnames are refused
            t.expect1(TSURL.url(`https://${String.fromCodePoint(0x301)}abc.com`)).null() ;
            t.expect2(TSURL.url(`https://a${String.fromCodePoint(0xFFFD)}b.com`)).null() ;
            t.expect3(() => TSURL.url(`https://a${String.fromCodePoint(0xFFFD)}b.com`, { throwsError:true })).throws(/bad hostname/) ;
            // ASCII hostnames are only lowercased
            t.expect4(TSURL.url('https://WWW.Example.COM/A')?.hostname).is('www.example.com') ;
        }) ;

        group.unary('pathname setter keeps a consistent href', async (t) => {
            // '?' and '#' would start the search and hash parts: they are escaped like the native URL class does
            const u = TSURL.url('https://example.com/p?x=1#top')! ;
            u.pathname = '/a?b#c' ;
            t.expect0(u.pathname).is('/a%3Fb%23c') ;
            t.expect1(u.href).is('https://example.com/a%3Fb%23c?x=1#top') ;
            const n = new URL('https://example.com/p?x=1#top') ; n.pathname = '/a?b#c' ;
            t.expect2(u.href).is(n.href) ;
            const back = TSURL.url(u.href)! ;                  // the href is read again as the same URL
            t.expect3(back.pathname).is(u.pathname) ;
            t.expect4(back.search).is(u.search) ;
            t.expect5(back.hash).is(u.hash) ;
            // the leading '/' is added to the pathname itself, not only in the href
            u.pathname = 'abc' ;
            t.expect6(u.pathname).is('/abc') ;
            t.expect7(u.href).is('https://example.com/abc?x=1#top') ;
        }) ;

        group.unary('from() / compose() / TSObject conformance', async (t) => {
            const u = TSURL.url(U)! ;
            t.expect0(TSURL.from(new URL('https://foo.bar/baz'))?.href).is('https://foo.bar/baz') ;
            t.expect1(TSURL.compose('https://api.test', '/v1/users')?.href).is('https://api.test/v1/users') ;
            t.expect2(TSURL.compose(null, 'x')?.href).is('http://localhost/x') ; // default origin
            t.expect3(TSURL.url(null)).null() ;
            t.expect4(TSURL.url('not a url')).null() ;

            const c = u.clone() ;
            t.expect5(c === u).false() ;
            t.expect6(c.isEqual(u)).true() ;
            t.expect7(u.isEqual(u)).true() ;
            t.expect8(u.isEqual('x')).false() ;
            t.expect9(c.compare(u)).is(Same) ;
            t.expectA(u.compare(TSURL.url('https://a.com/')!)).isnot(undefined) ;
            t.expectB(u.compare('x')).is(undefined) ;
            t.expectC(u.toArray()).is([u]) ;
        }) ;

        // regression : the throwsError option used to construct a TSError and
        // discard it (`new TSError(...)` with no `throw`), then fall through to
        // `return null` regardless — so `url()` never actually threw. Every one
        // of the six invalid-input branches in url() is covered here, once with
        // the default (silent null) behaviour and once with throwsError:true.
        group.unary('url() with { throwsError:true } actually throws', async (t) => {
            // default behaviour (no throwsError, or throwsError:false) : silent null
            t.expect0(TSURL.url('not a url')).null() ;                                        // bad protocol
            t.expect1(TSURL.url('http:example.com')).null() ;                                 // missing // before hostname
            t.expect2(TSURL.url('http:///path')).null() ;                                     // empty hostname
            t.expect3(TSURL.url('http://' + 'a'.repeat(256) + '/')).null() ;                   // hostname too long
            t.expect4(TSURL.url('http://[not-ipv6]/')).null() ;                                // bad ipv6 hostname
            t.expect5(TSURL.url('http://999.999.999.999/')).null() ;                           // bad ipv4 hostname
            t.expect6(TSURL.url('http://example.com/?a=1', { refusesParameters:true })).null() ; // unexpected parameters
            t.expect7(() => TSURL.url('not a url', { throwsError:false })).doesNotThrow() ;

            // throwsError:true : the very same inputs now really throw
            t.expect8(() => TSURL.url('not a url', { throwsError:true })).throws(/bad protocol/) ;
            t.expect9(() => TSURL.url('http:example.com', { throwsError:true })).throws(/unable to find \/\/ before hostname/) ;
            t.expectA(() => TSURL.url('http:///path', { throwsError:true })).throws(/bad hostname/) ;
            t.expectB(() => TSURL.url('http://' + 'a'.repeat(256) + '/', { throwsError:true })).throws(/bad hostname/) ;
            t.expectC(() => TSURL.url('http://[not-ipv6]/', { throwsError:true })).throws(/bad ipv6 hostname/) ;
            t.expectD(() => TSURL.url('http://999.999.999.999/', { throwsError:true })).throws(/bad ipv4 hostname/) ;
            t.expectE(() => TSURL.url('http://example.com/?a=1', { throwsError:true, refusesParameters:true })).throws(/unexpected parameters/) ;

            // and what's thrown is genuinely a TSError, not just some Error
            t.expectF(() => TSURL.url('not a url', { throwsError:true })).throws((e:any) => e instanceof TSError) ;
        }) ;
    }),
    TSTest.group("TSURL — invalid punycode hostnames", async (group) => {
        group.unary('utf8Href keeps the labels which cannot be decoded', async (t) => {
            const h = (s:string) => TSURL.url(s)?.utf8Href ;
            t.expect0(h('https://xn--a_b.com/')).is('https://xn--a_b.com/') ;                   // '_' is not a punycode digit
            t.expect1(h('https://xn--a-9999z.com/')).is('https://xn--a-9999z.com/') ;           // code point beyond 0x10FFFF
            t.expect2(h('https://xn--999999999999.com/')).is('https://xn--999999999999.com/') ; // integer overflow
            t.expect3(h('https://xn--99999999.com/')).is('https://xn--99999999.com/') ;         // truncated integer
            t.expect4(h('https://www.xn--a_b.xn--mnchen-3ya.de/')).is('https://www.xn--a_b.münchen.de/') ; // only the bad label is kept
            t.expect5(TSURL.url('https://xn--a_b.com/')?.href).is('https://xn--a_b.com/') ;
        }) ;
    }),
] ;

