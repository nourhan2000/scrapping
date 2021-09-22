//Imports

const puppeteer = require("puppeteer");
const dotenv = require("dotenv");
dotenv.config();
//GLOBAL VARIABLES
const WAIT_FOR_PAGE = 5000;
const DELAY_INPUT = 1;
const { promises: fs } = require("fs");


let browser = undefined
let page = undefined
let context = undefined

//Main Function
const scrapFun = async(indexed, isFirst, isLast) => {
    try {
        //starting Chrome
        if (indexed == 0) {
            browser = await puppeteer.launch({
                executablePath: process.env.CHROME_PATH,
                headless: false
            });
            context = browser.defaultBrowserContext();
            await context.overridePermissions(process.env.FB_LOGIN, ["notifications"]);

            //Opening the Facebook Login
            page = await browser.newPage({ viewport: null });
            await page.goto(process.env.FB_LOGIN);
            await delay(WAIT_FOR_PAGE);


            //logging in
            await page.waitForSelector('input[name="email"]');
            await page.type('input[name="email"]', process.env.FB_USER, {
                delay: DELAY_INPUT
            });
            await page.type('input[name="pass"]', process.env.FB_PW, {
                delay: DELAY_INPUT
            });
            await Promise.all([
                await page.click('button[data-testid="royal_login_button"]'),
                page.waitForNavigation({ waitUntil: "networkidle0" })
            ]);

            //Opening the Facebook Group
            await page.goto(process.env.FB_PAGE);
            await delay(WAIT_FOR_PAGE);
        }
        //scraping function
        const posts = await page.evaluate(async() => {
            let mydata = undefined
                //Scraping Data Function
            window.scrollBy(0, window.innerHeight);

            function delay(time) {
                return new Promise(function(resolve) {
                    setTimeout(resolve, time);
                });
            }
            await delay(5000);

            async function scrapData() {
                try {
                    window.scrollBy(0, window.innerHeight);

                    function delay(time) {
                        return new Promise(function(resolve) {
                            setTimeout(resolve, time);
                        });
                    }
                    await delay(5000);
                    // Detecting the number of the posts loaded on the browser
                    const postListLength = document.querySelectorAll(
                        'div[data-ad-preview="message"]'
                    ).length;
                    console.log("postListLength ", postListLength);
                    class Post {
                        constructor(document) {
                            console.log("post initiallized");
                            this.document = document;
                            this.postContainer = document.querySelector(
                                "div.du4w35lb.k4urcfbm.l9j0dhe7.sjgh65i0"
                            );
                            this.postdata = document.querySelector(
                                'div[data-ad-preview="message"]'
                            ); //getting post
                            this.postLikes = this.postContainer.querySelector(
                                "span.gpro0wi8.pcp91wgn"
                            );
                            this.postFooter = this.postContainer.querySelector(
                                "div.l9j0dhe7 > div > div.bp9cbjyn.j83agx80.pfnyh3mw.p1ueia1e"
                            );
                            // this.postShares = this.postContainer.querySelector(
                            //     "span.tojvnm2t.a6sixzi8.abs2jz4q.a8s20v7p.t1p8iaqh.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.iyyx5f41"
                            // );
                            this.postAuthor = this.postContainer.querySelector("strong");
                            this.postAuthorVerified = this.postContainer.querySelector(
                                'div[aria-label="Verified"]'
                            );
                            this.postTimestamp = this.postContainer.querySelector(
                                "span.tojvnm2t.a6sixzi8.abs2jz4q.a8s20v7p.t1p8iaqh.k5wvi7nf.q3lfd5jv.pk4s997a.bipmatt0.cebpdrjk.qowsmv63.owwhemhu.dp1hu0rb.dhp61c6y.iyyx5f41"
                            );

                        }
                        getpostfeatures() {
                                try {
                                    let data = {};
                                    let strFooter = this.postFooter.innerText.trim()
                                    let postComments = strFooter.substring(
                                        0,
                                        strFooter.indexOf("Comments")
                                    );
                                    let postShares = strFooter.substring(
                                        strFooter.lastIndexOf("Comments"),
                                        strFooter.indexOf("Shares")
                                    );

                                    if (postShares == undefined) postShares = "0";

                                    let isVerified;

                                    if (this.postAuthorVerified) {
                                        isVerified = true;
                                    } else {
                                        isVerified = false;
                                    }

                                    var today = new Date();
                                    var year = today.getFullYear();
                                    var month = today.getMonth() + 1;
                                    var day = today.getDate();
                                    var hour = today.getHours();
                                    var minute = today.getMinutes();
                                    var second = today.getSeconds();
                                    var date = year + "-" + month + "-" + day;
                                    var time = hour + ":" + minute + ":" + second;
                                    var dateTime = date + " " + time;
                                    if (this.postLikes == null) this.postLikes = "0";
                                    var postTime = this.postTimestamp.innerText.trim();
                                    console.log(this.postShares)
                                    console.log("time stamp:" + postTime);

                                    return new Promise(resolve => {
                                        //gettin the features we are intrested in from the post
                                        setTimeout(() => {
                                            if (this.postdata.querySelector("span") === null) {
                                                return resolve("");
                                            } else {
                                                data["post"] = this.postdata
                                                    .querySelector("span")
                                                    .innerText.trim();
                                                console.log("likes" + this.postLikes)
                                                data["likes"] = this.postLikes.innerText.trim();
                                                data["comments"] = postComments;
                                                data["shares"] = postShares;
                                                data["author"] = this.postAuthor.innerText.trim();
                                                data["isVerified"] = isVerified;
                                                //date["posttimestamp"] = postTime;
                                                data["now-date"] = dateTime;
                                                dateTime = "";
                                                return resolve(data);
                                            }
                                        }, 0);
                                    });
                                } catch (error) {
                                    console.log("scrap post error ===> ", error);
                                }
                            }
                            //to remove the post
                        removepost() {
                            this.postdata.remove();
                            this.postContainer.remove();
                            this.postLikes.remove();
                            this.postFooter.remove();
                            this.postAuthor.remove();
                            if (this.postAuthorVerified) this.postAuthorVerified.remove();
                            this.postTimestamp.remove();
                        }
                    } //end of post class
                    const post = new Post(document);
                    if (post.postdata) {
                        mydata = await post.getpostfeatures();
                        if (mydata["shares"].length > 2) {
                            mydata["shares"] = mydata["shares"].split("\n")[1];
                        }
                        console.log(mydata);
                        post.removepost();
                        if (!mydata || mydata == {}) {
                            await scrapData();
                        } else {
                            return {
                                posts: mydata
                            };

                        }
                    } else {
                        console.log("no post found ");
                        return {
                            posts: mydata
                        };
                    }
                } catch (error) {
                    console.error("error from scrapDataFunction ==>", error);
                    debugger;
                }
            }

            await scrapData();
            return {
                posts: mydata
            };
        });
        console.log(posts)
        storeDataInJSON('vid.json', posts["posts"], indexed, isFirst, isLast)
            //closing the browser
        if (isLast) await browser.close();
    } catch (error) {
        console.log("Catched error message", error.message);
        console.log("Catched error stack", error.stack);
        console.log("Catched error ", error);
    }
};

function storeDataInJSON(file, mydata, index, isFirst, isLast) {
    if (mydata) {
        var data = {
            post_id: index,
            post: mydata["post"],
            likes: mydata["likes"],
            comments: mydata["comments"],
            shares: mydata["shares"],
            author: mydata["author"],
            isVerified: mydata["isVerified"],
            //timestamp: mydata["posttimestamp"],
            dateNow: mydata["now-date"]
        };
        console.log(data);
        if (isFirst) {
            return fs.writeFile(file, "[" + JSON.stringify(data), err => {
                if (err) {
                    return err;
                }
                return;
            })
        } else if (isLast) {
            return fs.appendFile(file, ',' + JSON.stringify(data) + ']', err => {
                if (err) {
                    return err;
                }
                return;
            });
        } else {
            return fs.appendFile(file, ',' + JSON.stringify(data), err => {
                if (err) {
                    return err;
                }
                return;
            });
        }
    } else {
        console.log("no data to store in file")
        if (isLast) {
            return fs.appendFile(file, "]", err => {
                if (err) {
                    return err;
                }
                return;
            });
        }
    }
};

function delay(time) {
    return new Promise(function(resolve) {
        setTimeout(resolve, time);
    });
}

const run = async() => {
    let isFirst = false;
    let islast = false;
    for (let i = 0; i < 2; i++) {
        if (i == 0) {
            isFirst = true;
        }
        if (i == 1) {
            islast = true
        }
        await scrapFun(i, isFirst, islast);
        islast = false;
        isFirst = false;
    }
}

run()