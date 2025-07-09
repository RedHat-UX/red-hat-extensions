# Ask Red Hat

Ask Red Hat is a link that appears if the authenticated user has access to the Ask Red Hat AI assistant.

## Usage

```html
<rhx-ask-red-hat></rhx-ask-red-hat>

<script type="module">
  import '@rhdx/elements/rhx-ask-red-hat/rhx-ask-red-hat.js';

  const cpAsk = document.querySelector('rhx-ask-red-hat');
  await cpAsk.updateComplete;
  cpAsk.healthCheckEndpoint = 'http://access.redhat.com/api/ask/v1/health';
  cpAsk.hydraEndpoint = 'https://access.redhat.com/hydra/rest/contacts/sso/current';

  // Pseudo user auth
  if (user.session.isAuthenticated()) {
    // get values session pass them to cpAsk
    cpAsk.authToken = user.session.getToken();
    cpAsk.userId = user.session.getUserId();
  }
</script>

```
