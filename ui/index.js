var username = document.getElementById('uname').value;
var password = document.getElementById('psw').value;
const BACKEND_URI = "http://localhost:3005"

function setFormMessage(formElement, type, message) {
    const messageElement = formElement.querySelector(".form__message");

    messageElement.textContent = message;
    messageElement.classList.remove("form__message--success", "form__message--error");
    messageElement.classList.add(`form__message--${type}`);
}

function setInputError(inputElement, message) {
    inputElement.classList.add("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = message;
}

function clearInputError(inputElement) {
    inputElement.classList.remove("form__input--error");
    inputElement.parentElement.querySelector(".form__input-error-message").textContent = "";
}

function like(id, val){
    $.ajax({
        type: "PUT",
        url: BACKEND_URI+'/code/'+id,
        headers: {
            'Authorization': 'Bearer '+localStorage.getItem('access')
        },
        data: {rating:null, is_correct:val},
        success: (response) => {
            if (!response){
                document.getElementsByClassName("results")[0].innerHTML = `<h3>Could not update, refresh the page!</h3>`
                return
            }
            confirm("Updated Successfully")
            populateResults(document.getElementsByClassName('search')[0].value)
        },
        error: function(jqXHR, textStatus, errorThrown){
            if (jqXHR.status==403){
                alert("Session timed out!")
                localStorage.removeItem('email');
                localStorage.removeItem('access');
                window.location.reload()
            }
            else
                alert("Internal Server Error")
            // console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
        }
    });
}

function save(data,id,lang) {
    // let data = document.querySelector(".prev-code > span").value;
    var c = document.createElement("a");

    let ext = ""
    switch(lang){
        case "python": ext = "py"
            break;
        case "c": ext = "c"
            break;
        case "c++": ext = "cpp"
            break;
        case "javascript": ext = "js"
            break;
        case "java": ext = "java"
            break;
        case "rust": ext = "rc"
            break;
        case "golang": ext = "go"
            break;
        case "ruby": ext = "rb"
            break;
        case "shell": ext = "sh"
            break;
        default:
            ext = "txt"
            break;
    }
    c.download = id+"_code."+ext;
    
    var t = new Blob([decodeURI(data)], {
        type: "text/plain"
    });
    c.href = window.URL.createObjectURL(t);
    c.click();
}

function preview(contents,id,is_correct,lang){
    window.scrollTo(0, 0);
    var body = ''
    if (!is_correct){
        body = '<p style="color:red;font-size:smaller;">This code has been marked incorrect by some user(s).</p>'
    }
    body += '<p class="prev-code"><span style="white-space: pre-line">'+decodeURI(contents)+'</span></p>'

    if (localStorage.getItem('email'))
        body += '<hr/><div class="btn-group" style="float:right"> \
                        <button class="btn" onClick="save(`'+contents+'`,`'+id+'`,`'+lang+'`);" title="Download"><i class="fa-solid fa-download"></i></button> \
                        <button class="btn react" onClick="like(`'+id+'`,1);" title="Mark Correct"><i class="fa-solid fa-check"></i></button> \
                        <button class="btn react" onClick="like(`'+id+'`,0);" title="Mark Incorrect"><i class="fa-solid fa-xmark"></i></button> \
                        <button class="btn" onClick="rate(`'+id+'`);"><i class="fa-solid fa-pencil"></i> Rate</button></div>'
    document.getElementsByClassName("preview")[0].innerHTML = body
}

function populateResults(searchKey, page=1) {
    searchKey.replace('\\', '');
    $.ajax({
        type: "GET",
        url: BACKEND_URI+'/code/search?search='+searchKey+'&page='+page,
        headers: {
            'Authorization': 'Bearer '+localStorage.getItem('access')
        },
        success: (response) => {
            if (!response){
                document.getElementsByClassName("results")[0].innerHTML = `<h3>No results found!</h3>`
                return
            }
            console.log(response)
            data = response.data
            var newElem = ""
            data.forEach((n)=>{
                let auth = "Anonymous"
                if ('author' in n)
                    auth = n.author

                if (n.is_correct){
                    newElem += `<div class="card" id=${n._id} style="background-color: #eee">
                    <h5 class='author'>Author: ${auth?auth:"Anonymous"}</h5>
                    <h3 class="title">${n.name}</h3>`
                } else {
                    newElem += `<div class="card" id=${n._id} style="background-color: #ffbfbf">
                    <h5 class='author'>Author: ${auth?auth:"Anonymous"}</h5>
                    <h3 class="title" style="color: red">${n.name}</h3>`
                }

                if (n.rating == -1.00)
                    newElem += `<h6 class="desc" >${n.count} Views</h6>`
                else
                    newElem += `<h6 class="desc" >${n.count} Views, ${n.rating.toFixed(2)} Rating</h6>`
                  
                newElem += `<h6>Language: ${n.lang} </h6>`
                  
                n.meta.forEach((m,i) => {
                    if (i>0)
                        newElem += ` <span class="tag">${m}</span>`
                    else
                        newElem += `<span class="tag">${m}</span>`
                })

                escaped_content = n.contents.replace('<','&lt')
                escaped_content = escaped_content.replace('>','&gt')
                newElem += '<p class="code"><span style="white-space: pre-line">'+escaped_content.substring(0, 150)+'</span> \
                    <button class="readmore" onclick=preview(`'+encodeURI(escaped_content)+'`,`'+n._id+'`,'+n.is_correct+',`'+n.lang+'`)>Show Code... </button> \
                </p>\
                </div>'
            })

            if (page>1)
                newElem += '<button class="btn" onClick="populateResults(`'+searchKey+'`,'+(page-1)+');" title="Next"><i class="fa-solid fa-angle-left"></i> Previous</button>'
            if (response.count > (page-1)*10+data.length)
                newElem += '<button class="btn" onClick="populateResults(`'+searchKey+'`,'+(page+1)+');" title="Next">Next <i class="fa-solid fa-angle-right"></i></button>'
            
            document.getElementsByClassName("results")[0].innerHTML = newElem
        },
        error: function(jqXHR, textStatus, errorThrown){
            if (jqXHR.status==403){
                alert("Session timed out!")
                localStorage.removeItem('email');
                localStorage.removeItem('access');
                window.location.reload()
            }
            else if (jqXHR.status==204)
                alert("No results found")
            else
                alert("Internal Server Error")
            // console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
        }
    });
}


function rate(id) {
    let rating = prompt("Enter your rating(0-10) > ");
    if (rating){
        if (parseFloat(rating)<10 && parseFloat(rating)>0){
            $.ajax({
                type: "PUT",
                url: BACKEND_URI+'/code/'+id,
                headers: {
                    'Authorization': 'Bearer '+localStorage.getItem('access')
                },
                data: {rating:parseFloat(rating), is_correct:1},
                success: (response) => {
                    if (!response){
                        document.getElementsByClassName("results")[0].innerHTML = `<h3>Could not update, refresh the page!</h3>`
                        return
                    }
                    confirm("Updated Successfully")
                    populateResults(document.getElementsByClassName('search')[0].value)
                },
                error: function(jqXHR, textStatus, errorThrown){
                    if (jqXHR.status==403){
                        alert("Session timed out!")
                        localStorage.removeItem('email');
                        localStorage.removeItem('access');
                        window.location.reload()
                    }
                    else
                        alert("Internal Server Error")
                    // console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
                }
            });
        } else {
            alert("Invalid rating, try again")
        }
    }
};

function toggleLogin(){
    document.getElementsByClassName('search-page')[0].style.display = 'none'
    document.getElementsByClassName('container')[0].style.display = 'block'
}

function landing(){
    const uname = localStorage.getItem('email');
    populateResults("")
    if (uname){
        document.getElementById("welcome").innerText = "Welcome, "+uname.split('@')[0]
        document.getElementById('d-btn').innerHTML = `<button onclick="document.getElementById('ide').style.display='block'" class="btn"> Submit Code </button>`
    } else {
        document.getElementById("welcome").innerText = "Home"
        document.getElementById('d-btn').innerHTML = `<button onclick="toggleLogin()" class="btn"> Login </button>`
    }
}

document.addEventListener("DOMContentLoaded", () => {
    landing()
    const loginForm = document.querySelector("#login");
    const createAccountForm = document.querySelector("#createAccount");
    const codeForm = document.querySelector("#codeEditor");

    document.querySelector("#linkCreateAccount").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.add("form--hidden");
        createAccountForm.classList.remove("form--hidden");
    });

    document.querySelector("#linkLogin").addEventListener("click", e => {
        e.preventDefault();
        loginForm.classList.remove("form--hidden");
        createAccountForm.classList.add("form--hidden");
    });

    document.querySelector("#logout").addEventListener("click", e => {
        localStorage.removeItem('email');
        localStorage.removeItem('access');
        window.location.reload(true)
    });

    createAccountForm.addEventListener("submit", e => {
        e.preventDefault();
        let pwd = document.getElementById('password').value
        let cpwd = document.getElementById('confirmp').value
        let uname = document.getElementById('email').value
        if (pwd!=cpwd){
            setFormMessage(createAccountForm, "error", "Password doesn't match");
            return
        }
        $.ajax({
            type: "POST",
            url: BACKEND_URI+'/api/register',
            data: JSON.stringify({email:uname,password:pwd}),
            success: (data) => {
                // document.cookie = `access=${encodeURIComponent(data.token)}; max-age=${60 * 60}`
                localStorage.setItem("access",data.token);
                localStorage.setItem("email",uname);
                document.getElementsByClassName('container')[0].style.display = 'none';
                document.getElementsByClassName('search-page')[0].style.display = 'block';
                landing()
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("User already exists!")
                console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
            },
            dataType: "json",
            contentType : "application/json"
        });
    
    });

    loginForm.addEventListener("submit", e => {
        e.preventDefault();
        // setFormMessage(loginForm, "error", "Invalid username/password combination");
        let pwd = document.getElementById('psw').value
        let uname = document.getElementById('uname').value
        $.ajax({
            type: "POST",
            url: BACKEND_URI+'/api/login',
            data: JSON.stringify({email:uname,password:pwd}),
            success: (data) => {
                // document.cookie = `access=${encodeURIComponent(data.token)}; max-age=${60 * 60}`
                localStorage.setItem("access",data.token);
                localStorage.setItem("email",uname);
                document.getElementsByClassName('container')[0].style.display = 'none';
                document.getElementsByClassName('search-page')[0].style.display = 'block';
                landing()
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("Incorrect Password or Email!")
                console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
            },
            dataType: "json",
            contentType : "application/json"
        });
    });

    codeForm.addEventListener("submit", e => {
        e.preventDefault();
        // setFormMessage(loginForm, "error", "Invalid username/password combination");
        let meta = document.getElementById('tags').value  //.split(",")
        let lang = document.getElementById('lang').value
        let code = document.getElementById('code').value
        let name = document.getElementById('name').value
        var lines = code.split("\n");
        var count = lines.length;

        let data = {name:name,lang:lang,contents:code,m:meta,size:count,author:localStorage.getItem('email')}
        console.log(data)
        $.ajax({
            type: "POST",
            url: BACKEND_URI+'/code',
            headers: {
                'Authorization': 'Bearer '+localStorage.getItem('access')
            },
            data: JSON.stringify(data),
            success: (response) => {
                alert("Code submitted successfully!")
                var modal = document.getElementById("ide");
                modal.style.display = "none";
                populateResults("")
            },
            error: function(jqXHR, textStatus, errorThrown){
                alert("Could not upload your code!")
                console.log(textStatus + ": " + jqXHR.status + " " + errorThrown);
            },
            dataType: "json",
            contentType : "application/json"
        });
    });

    var timeoutId = 0;
    $('.search').on('keyup', (e) => {
        clearTimeout(timeoutId); // doesn't matter if it's 0
        // let results = JSON.parse(`{
        //     "data": [
        //         {
        //             "_id": "635c0ec92b964f09cd86dcec",
        //             "name": "test.py",
        //             "lang": "python",
        //             "contents": "print(\"Hello world\")",
        //             "meta": [
        //                 "[\"dp\"]"
        //             ],
        //             "size": 1,
        //             "__v": 0,
        //             "count": 5,
        //             "is_correct": true,
        //             "rating": -1
        //         },
        //         {
        //             "_id": "635c101d68d42b910bc196d3",
        //             "name": "test.py",
        //             "lang": "python",
        //             "contents": "print(\"Hello world\")",
        //             "meta": [
        //                 "dp",
        //                 "greedy"
        //             ],
        //             "size": 1,
        //             "author": "",
        //             "__v": 0,
        //             "count": 0,
        //             "is_correct": true,
        //             "rating": -1
        //         }
        //     ]}`)
        timeoutId = setTimeout(() => {
            // console.log(e.target.value)
            populateResults(e.target.value)
            document.getElementsByClassName("preview")[0].innerHTML = `<span style="float: right;color: grey;">Preview</span>`
        }, 900);
    });

    var span = document.getElementsByClassName("close")[0];
    var modal = document.getElementById("ide");
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
          modal.style.display = "none";
        }
    }

    // document.querySelectorAll(".form__input").forEach(inputElement => {
    //     inputElement.addEventListener("blur", e => {
    //         if (e.target.id === "signupUsername" && e.target.value.length > 0 && e.target.value.length < 8) {
    //             setInputError(inputElement, "Username must be at least 8 characters in length");
    //         }
    //     });

    //     inputElement.addEventListener("input", e => {
    //         clearInputError(inputElement);
    //     });
    // });
});