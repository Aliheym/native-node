function getUserData() {
  const token = localStorage.getItem('sessionData');
  if (!token) return null;

  const sessionData = atob(token.split('.')[1]);
  const userData = JSON.parse(sessionData);

  return userData;
}

const root = document.querySelector('#root');
const router = new Router(root);

router.addRoute('/', () => {
  function onMount() {
    const links = document.querySelectorAll('.js-link');

    links.forEach((link) =>
      link.addEventListener('click', (event) => {
        event.preventDefault();

        router.linkTo(link.getAttribute('href'));
      })
    );
  }

  const userData = getUserData();

  let render = '';
  if (userData) {
    render = `
      <div class="container mt-5">
         <div class="notification is-primary">
           Hi, <strong>${userData.email}</strong>
          </div>
      ${
        userData.isAdmin
          ? '<a class="js-link button" href="/invite">Invite new user</a>'
          : ''
      }
        <a class="js-link button" href="/logout">Log out</a>
      </div>
    `;
  } else {
    return router.redirect('/login');
  }

  return [render, onMount];
});

router.addRoute('/login', () => {
  const userData = getUserData();
  if (userData) {
    return router.linkTo('/');
  }

  function onMount() {
    const authForm = document.querySelector('.js-auth-form');
    const emailField = document.querySelector('.js-auth-email');
    const passwordField = document.querySelector('.js-auth-password');
    const message = document.querySelector('.js-message');
    const sendButton = document.querySelector('.js-send');
    const links = document.querySelectorAll('.js-link');

    links.forEach((link) =>
      link.addEventListener('click', (event) => {
        event.preventDefault();

        router.linkTo(link.getAttribute('href'));
      })
    );

    authForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const email = emailField.value;
      const password = passwordField.value;

      sendButton.disable = true;
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      sendButton.disable = false;
      const result = await response.json();

      if (result.error) {
        message.textContent = result.error;
      } else {
        localStorage.setItem('sessionData', result.token);
        router.linkTo('/');
      }
    });
  }

  return [
    `<div class="container mt-5">
        <div class="columns">
          <div class="column is-one-third">
            <form action="/" class="js-auth-form" method="POST">
              <div class="field">
                <label class="label">Email</label>
                <div class="control">
                  <input class="js-auth-email input" type="text" placeholder="Enter an email for invintation" required>
                </div>
              </div>
              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input class="js-auth-password input" type="password" placeholder="Input your password" required>
                </div>
              </div>
              <div class="field">
                <div class="control mb-2">
                  <button type="submit" class="js-send button is-link">Submit</button>
                </div>
                <div class="control">
                  <a href="/forgot-password" class="button js-link">Forgot password</a>
                </div>
                <p class="js-message help is-danger"></p>
              </div>
            <form>
          </div>
        </div>
      </div>
      `,
    onMount,
  ];
});

router.addRoute('/logout', () => {
  const userData = getUserData();
  if (!userData) {
    return router.linkTo('/');
  }

  localStorage.removeItem('sessionData');

  return router.linkTo('/login');
});

router.addRoute('/invite', () => {
  const userData = getUserData();
  if (!userData || !userData.isAdmin) {
    return router.linkTo('/');
  }

  function onMount() {
    const form = document.querySelector('.js-invite');
    const emailField = document.querySelector('.js-invite-email');
    const message = document.querySelector('.js-message');
    const sendButton = document.querySelector('.js-send');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      sendButton.disabled = true;

      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization': localStorage.getItem('sessionData'),
        },
        body: JSON.stringify({ email: emailField.value }),
      });

      sendButton.disabled = false;

      const result = await response.json();
      if (result.error) {
        message.classList.remove('is-success');
        message.classList.add('is-danger');

        message.textContent = result.error;
      } else {
        message.classList.add('is-success');
        message.classList.remove('is-danger');

        message.textContent = `Invition was sended`;
        emailField.value = '';
      }
    });
  }

  return [
    `<div class="container mt-5">
        <button class="button mb-3" onclick="history.back()">Back</button>
        <div class="columns">
          <div class="column is-one-third">
            <form action="/" class="js-invite" method="POST">
              <div class="field">
                <label class="label">Email</label>
                <div class="control">
                  <input class="js-invite-email input" type="email" placeholder="Enter an email for invintation" required>
                </div>
                <p class="js-message help is-danger"></p>
              </div>
              <div class="field">
                <div class="control">
                  <button type="submit" class="js-send button is-link">Submit</button>
                </div>
              </div>
            <form>
          </div>
        </div>
      </div>
      `,
    onMount,
  ];
});

router.addRoute('/complete-invitation', () => {
  const userData = getUserData();
  if (userData) {
    return router.linkTo('/');
  }

  const code = new URL(window.location).searchParams.get('code');

  function onMount() {
    const form = document.querySelector('.js-complete-invite');
    const passwordField = document.querySelector('.js-invite-password');
    const message = document.querySelector('.js-message');
    const sendButton = document.querySelector('.js-send');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      sendButton.disabled = true;

      const response = await fetch(`/api/complete-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordField.value, code }),
      });

      sendButton.disabled = false;

      const result = await response.json();
      if (result.token) {
        localStorage.setItem('sessionData', result.token);
        router.linkTo('/');
      } else {
        message.classList.remove('is-success');
        message.classList.add('is-danger');

        message.textContent = result.error;
      }
    });
  }
  return [
    `<div class="container mt-5">
        <div class="columns">
          <div class="column is-one-third">
            <form action="/" class="js-complete-invite" method="POST">
              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input class="js-invite-password input" type="text" placeholder="Enter a desired password" required>
                </div>
                <p class="js-message help is-danger"></p>
              </div>
              <div class="field">
                <div class="control">
                  <button type="submit" class="js-send button is-link">Submit</button>
                </div>
                <a href="https://www.facebook.com/v9.0/dialog/oauth?
    client_id=759704694584332
    &redirect_uri=http://localhost:3000/oauth-redirect/facebook
    &scope=email" class="social-button facebook"> <span>Sign Up with Facebook</span></a>
			          <a href="https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Foauth-redirect%2Fgoogle&client_id=507624558871-10fdtkgphp5qnku230c4k9r97bl5q1ga.apps.googleusercontent.com&access_type=offline&scope=openid+email" class="social-button google"> <span>Sign Up with Google</span></a>
              </div>
            <form>
          </div>
        </div>
      </div>
      `,
    onMount,
  ];
});

router.addRoute('/forgot-password', () => {
  const userData = getUserData();
  if (userData) {
    return router.linkTo('/');
  }

  function onMount() {
    const form = document.querySelector('.js-recover');
    const emailField = document.querySelector('.js-recover-email');
    const message = document.querySelector('.js-message');
    const sendButton = document.querySelector('.js-send');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      sendButton.disabled = true;

      const response = await fetch(`/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailField.value }),
      });

      sendButton.disabled = false;

      const result = await response.json();
      if (result.error) {
        message.classList.remove('is-success');
        message.classList.add('is-danger');

        message.textContent = result.error;
      } else {
        message.classList.add('is-success');
        message.classList.remove('is-danger');

        message.textContent = `Recover message was sended`;
        emailField.value = '';
      }
    });
  }
  return [
    `<div class="container mt-5">
        <button class="button mb-3" onclick="history.back()">Back</button>
        <div class="columns">
          <div class="column is-one-third">
            <form action="/" class="js-recover" method="POST">
              <div class="field">
                <label class="label">Email</label>
                <div class="control">
                  <input class="js-recover-email input" type="email" placeholder="Enter a desired password" required>
                </div>
                <p class="js-message help is-danger"></p>
              </div>
              <div class="field">
                <div class="control">
                  <button type="submit" class="js-send button is-link">Send recover</button>
                </div>
              </div>
            <form>
          </div>
        </div>
      </div>
      `,
    onMount,
  ];
});

router.addRoute('/complete-recover', () => {
  const userData = getUserData();
  if (userData) {
    return router.linkTo('/');
  }

  const code = new URL(window.location).searchParams.get('code');

  function onMount() {
    const form = document.querySelector('.js-complete-recover');
    const passwordField = document.querySelector('.js-recover-password');
    const message = document.querySelector('.js-message');
    const sendButton = document.querySelector('.js-send');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      sendButton.disabled = true;

      const response = await fetch(`/api/complete-recover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: passwordField.value, code }),
      });

      sendButton.disabled = false;

      const result = await response.json();
      if (result.token) {
        localStorage.setItem('sessionData', result.token);
        router.linkTo('/');
      } else {
        message.textContent = result.error;
      }
    });
  }
  return [
    `<div class="container mt-5">
        <div class="columns">
          <div class="column is-one-third">
            <form action="/" class="js-complete-recover" method="POST">
              <div class="field">
                <label class="label">Password</label>
                <div class="control">
                  <input class="js-recover-password input" type="text" placeholder="Enter a desired password" required>
                </div>
                <p class="js-message help is-danger"></p>
              </div>
              <div class="field">
                <div class="control">
                  <button type="submit" class="js-send button is-link">Submit</button>
                </div>
              </div>
            <form>
          </div>
        </div>
      </div>
      `,
    onMount,
  ];
});

router.addRoute('', () => {
  return `<div class="centered">
      Not Found!
    </div>`;
});

router.route();
