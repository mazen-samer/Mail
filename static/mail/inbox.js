document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);
  //Submit Form
  document.querySelector("#compose-form").addEventListener("submit", sendEmail);
  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#emails-detail-view").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function email_view(id) {
  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((email) => {
      // Print email
      console.log(email);
      document.querySelector("#emails-view").style.display = "none";
      document.querySelector("#compose-view").style.display = "none";
      document.querySelector("#emails-detail-view").style.display = "block";
      document.querySelector("#emails-detail-view").innerHTML = `
      <ul>
      <li><strong>From: </strong>${email.sender}</li>
      <li><strong>To: </strong>${email.recipients}</li>
      <li><strong>Subject: </strong>${email.subject}</li>
      <li><strong>Time: </strong>${email.timestamp}</li>
      <hr>
      <li>${email.body}</li>
      </ul>
      `;

      //Change to read
      if (!email.read) {
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            read: true,
          }),
        });
      }
      //Archive/Unarchive the email
      const btn_arc = document.createElement("button");
      btn_arc.innerHTML = email.archived ? "Unarchive" : "Archive";
      btn_arc.className = email.archived ? "unarchive" : "archive";
      btn_arc.addEventListener("click", function () {
        fetch(`/emails/${email.id}`, {
          method: "PUT",
          body: JSON.stringify({
            archived: !email.archived,
          }),
        }).then(() => {
          load_mailbox("archive");
        });
      });
      document.querySelector("#emails-detail-view").append(btn_arc);

      //Reply button
      const btn_rep = document.createElement("button");
      btn_rep.innerHTML = "Reply";
      btn_rep.addEventListener("click", function () {
        compose_email();

        document.querySelector("#compose-recipients").value = email.sender;
        let subject = email.subject;
        if (!subject.includes("Re:", 0)) {
          subject = "Re: " + email.subject;
        }
        document.querySelector("#compose-subject").value = subject;
        document.querySelector(
          "#compose-body"
        ).value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector("#emails-detail-view").append(btn_rep);
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#emails-detail-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  //Get the emails for particular
  fetch(`/emails/${mailbox}`)
    .then((response) => response.json())
    .then((emails) => {
      //Loop through emails and create a div for each
      emails.forEach((singleEmail) => {
        const newEmail = document.createElement("div");
        newEmail.innerHTML = `
        <div class="inner-contents">
        <h6>${singleEmail.sender}</h6>
        <p>${singleEmail.subject}</p>
        </div>
        ${singleEmail.timestamp}
        `;
        newEmail.classList.add("card");
        //Change background-color according to read
        newEmail.classList.add(singleEmail.read ? "read" : "unread");
        //Add event click
        newEmail.addEventListener("click", function () {
          email_view(singleEmail.id);
        });
        document.querySelector("#emails-view").append(newEmail);
      });
    });
}

function sendEmail(event) {
  event.preventDefault();
  //Store values of form
  const recipient = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;
  //Send data
  fetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      recipients: recipient,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.json())
    .then((result) => {
      // Print result
      console.log(result);
      load_mailbox("sent");
    });
}
