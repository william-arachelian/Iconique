var before_loading = document.getElementById("content-before-loading");
var c = 0;

function getInformation() {
    fetch(`/home/getRecomendedPosts`)
    .then((response) => response.json())
    .then((data) => {
        data.forEach((cardName) => {
            const new_div = document.createElement("div");
            new_div.className = "bg-white shadow-lg p-4 mb-4 rounded-lg cursor-pointer w-[80%] h-screen";

            new_div.innerHTML = `
                <h3 class="text-lg font-semibold mb-2">${cardName.username}</h3>
                <img src="${cardName.image}" alt="Post Image" class="object-contain w-full h-[65%] object-cover mb-3">
                <p class="mb-1">${cardName.description}</p>
                <p class="text-sm text-gray-600 mb-2 truncate">Clothing Links: ${cardName.clothingLinks}</p>

            `;
            
            const button_div = document.createElement("div")
            button_div.className = "flex w-[60%] justify-between items-center ";

            button_div.innerHTML = `
            <button class="${cardName.isLiked ? 'dislike-button' : 'like-button'} w-[80px]" data-id="${cardName.id}" data-userid="${cardName.userid}">
                    ${cardName.isLiked ? 'Dislike' : 'Like'}: ${cardName.likes}
                </button>
                <br>
                <button class="red-button" data-post-id=${cardName.id} data-reported-user=${cardName.username}>Report Post</button>
                <br></br>
            `
           
            const button = document.createElement("button");
            button.textContent = "View Post";
            button.className = "view-post-button ";
            button.style.width = "100px";
            button.addEventListener("click", () => {
                const postId = cardName.id;
                window.location.href = `/posts/${postId}`;
            });
            button_div.appendChild(button);
            
            new_div.append(button_div);
             // Keywords
             if (cardName.keywords.length > 0) {
                const keywords_div = document.createElement("div");
                keywords_div.className = "mb-4";
                keywords_div.innerHTML = "<h4 class='font-semibold text-sm mt-2'>Keywords:</h4>";

                cardName.keywords.forEach((keyword) => {
                    const keyword_span = document.createElement("span");
                    keyword_span.className = "bg-icon200 text-icon900 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded";
                    keyword_span.textContent = keyword;
                    keywords_div.appendChild(keyword_span);
                });

                new_div.appendChild(keywords_div);
            }

            // Comments
            if (cardName.comments.length > 0) {
                cardName.comments.slice(0, 3).forEach((comment) => {
                    const comment_div = document.createElement("div");
                    comment_div.className = "border-t border-gray-200 pt-2 mt-2";
                    comment_div.innerHTML = `
                        <p class="text-sm text-gray-700"><strong>User:</strong> ${comment.user}</p>
                        <p class="text-sm text-gray-700">${comment.text}</p>
                    `;
                    new_div.appendChild(comment_div);
                });
                if (cardName.comments.length > 3) {
                    const more_comments_div = document.createElement("div");
                    more_comments_div.className = "text-sm text-gray-500 italic mt-2";
                    more_comments_div.innerHTML = "More comments";
                    new_div.appendChild(more_comments_div);
                }
            } else {
                const no_comments_div = document.createElement("div");
                no_comments_div.className = "text-sm text-gray-500 italic mt-2";
                no_comments_div.innerHTML = "No comments";
                new_div.appendChild(no_comments_div);
            }


            before_loading.appendChild(new_div);
        });
        c++;
    })

    //change?
    .catch((error) =>  window.location.href = "/error?error=Internal+Server+Error");
}

before_loading.addEventListener('click', function(event) {
    if (event.target.classList.contains('like-button')) {
        const button = event.target;
        const postId = button.getAttribute('data-id');
        const userId = button.getAttribute('data-userid');

        fetch(`/posts/addLike/${postId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userid: userId }),
        })
        .then((response) => response.json())
        .then((data) => {
            button.textContent = `Dislike: ${data.likes.length}`;
            button.classList.replace('like-button', 'dislike-button');
        })
        .catch((error) => window.location.href = "/error?error=Internal+Server+Error");
    } else if (event.target.classList.contains('dislike-button')) {
        const button = event.target;
        const postId = button.getAttribute('data-id');

        fetch(`/posts/removeLike/${postId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userid: button.getAttribute('data-userid') }),
        })
        .then((response) => response.json())
        .then((data) => {
            button.textContent = `Likes: ${data.likes.length}`;
            button.classList.replace('dislike-button', 'like-button');
        })
        .catch((error) =>  window.location.href = "/error?error=Internal+Server+Error");
    }
});

window.addEventListener("scroll", () => {
    if (document.documentElement.scrollTop + document.documentElement.clientHeight >= document.documentElement.scrollHeight) {
        getInformation();
    }
});

getInformation();

$(document).ready(() => {
    let hold = '';
    let user = '';
    let activeReport = null;
    $(document).on("click", ".report",function(event) {
        event.preventDefault();
        if (activeReport !== null) {
            $(activeReport).siblings(".report-reason").remove();
            $(activeReport).siblings(".submit-report").remove();
            $(activeReport).show();
        }

        const postId = $(this).data("post-id");
        hold = postId;
        const username = $(this).data("reported-user");
        user = username;
        activeReport = this;

        $(this).after('<input type="text" class="report-reason" id="report-' + postId + '"  placeholder="Enter reason for reporting...">');
        $(this).after('<button class="submit-report" data-report-reason="{{report-reason}}">Submit</button>');
        $(this).hide();
    });

    $(document).on("click",".submit-report",function(event) {
        event.preventDefault();
        $("#error").remove();
        const postId = hold;
        const username = user;
        const reportReason = document.getElementById("report-" + postId).value;
        let errors = [];

        if(reportReason.length ==0){
            errors.push("Cannot submit empty reason");
        }

        if(typeof reportReason != 'string'){
            errors.push("Reason has to be a string");
        }

        if (!reportReason.match(/^[0-9a-zA-Z\s]+$/)) {
            errors.push("Reason can only be alphanumeric and contain spaces");
        }  

        if (errors.length) {
            event.preventDefault();
            $(this).append(`<p id='error'>Invalid Inputs: ${errors.join(", ")}</p>`);
            $('#error').reset();
        }

        $.ajax({
            type: "POST", 
            url: "/reports", 
            data: {
                postId: postId,
                username: username,
                reason: reportReason
            },
            success: function(response) {
                console.log("Report submitted successfully");
                // Remove the text input and submit button
                // $(this).prev(".report-reason").remove();
                // $(this).remove();
                // $(this).closest(".report").find(".report-button").show();
            },
            error: function(xhr, status, error) {
                // Handle errors if any
                console.error("Error submitting report:", error);
            }
        });
        // Remove the text input and submit button
        $("#report-" + postId).remove();
        $(this).remove();
        // Show the report button again
        $(".report[data-post-id='" + postId + "']").show();

        activeReport = null;
    });


});