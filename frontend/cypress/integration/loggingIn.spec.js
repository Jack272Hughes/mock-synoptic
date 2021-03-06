function attemptLogIn(
  username = "User",
  password = "Hello123",
  buttonName = "Log In"
) {
  cy.get("input[name='username']").type(username, { force: true });
  cy.get("input[name='password']").type(password, { force: true });
  cy.contains(buttonName).click();
}

const requestBodyContains = shouldContain => xhr => {
  Object.entries(shouldContain).forEach(([key, value]) => {
    expect(xhr.request.body.get(key)).to.equal(value);
  });
};

describe("When signing up to the app it", () => {
  beforeEach(() => cy.visit("http://localhost:3000"));

  it("Should allow you to sign up and log you in", () => {
    cy.server();
    cy.route("POST", "/signup").as("signupRequest");
    attemptLogIn("username1", "password1", "Sign Up");
    cy.wait("@signupRequest");
    cy.get("@signupRequest").then(
      requestBodyContains({ username: "username1", password: "password1" })
    );
    cy.contains("username1").should("exist");
  });

  it("Shouldn't allow you to sign up with a username that is in use", () => {
    attemptLogIn("User", "password", "Sign Up");
    cy.contains("Username is already in use").should("exist");
  });
});

describe("When logging into the app it", () => {
  beforeEach(() => cy.visit("http://localhost:3000"));

  it("Should allow you to log in", () => {
    cy.server();
    cy.route("POST", "/login").as("loginRequest");
    attemptLogIn();
    cy.wait("@loginRequest");
    cy.get("@loginRequest").then(
      requestBodyContains({ username: "User", password: "Hello123" })
    );
  });

  it("Should show your username in the navbar", () => {
    attemptLogIn();
    cy.contains("User").should("exist");
  });

  it("Should come up with an error when log in credentials are incorrect", () => {
    attemptLogIn("User", "incorrectPassword");
    cy.contains("Incorrect username/password").should("exist");
  });

  it("Should come up with an error when username doesn't exist", () => {
    attemptLogIn("unknown", "password");
    cy.contains("Incorrect username/password").should("exist");
  });
});

describe("When logged into the app it", () => {
  beforeEach(() => cy.visit("http://localhost:3000"));

  it("Should have a button called Logout in the navbar", () => {
    attemptLogIn();
    cy.contains("Logout");
  });

  it("Should allow you to log out", () => {
    attemptLogIn();
    cy.contains("Logout").click();
    cy.contains("Login").should("exist");
  });

  it("Should add a cookie with a jwt", () => {
    attemptLogIn();
    cy.getCookie("authToken")
      .should("have.property", "value")
      .then(value => expect(value).to.match(/eyJ.*?\.eyJ.*?\..*/));
  });

  it("Should add a cookie with an rft", () => {
    attemptLogIn();
    cy.getCookie("rft")
      .should("have.property", "value")
      .then(value => {
        expect(value).to.have.lengthOf(24);
        expect(value).to.match(/.*?==/);
      });
  });

  it("Should display the navbar", () => {
    cy.get("[data-test-id='navbar']").should("not.exist");
    attemptLogIn();
    cy.get("[data-test-id='navbar']").should("exist");
  });
});
