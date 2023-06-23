"use strict";

// process.env.CDS_REQUIRES_MIDDLEWARES = false;
// process.env.CDS_FEATURES_SERVE__ON__ROOT = false;
// process.env.CDS_PROTOCOLS = JSON.stringify({ 'odata-v4': { path: '/custom/odata/path' }});

const cds = require("@sap/cds");
const supertest = require("supertest");

const util = require("./_env/util/request");

cds.test(__dirname + "/_env");

let request;

const expectGET = async (request, path) => {
  await expectGETService(request, path);
  await expectGETServiceData(request, `${path}/Header`);
};

const expectGETService = async (request, path) => {
  const response = await util.callRead(request, path, {
    accept: "application/json",
  });
  expect(response.body).toBeDefined();
  expect(response.body).toEqual({
    d: {
      EntitySets: ["Header", "HeaderItem", "HeaderLine"],
    },
  });
};

const expectGETServiceData = async (request, path) => {
  const response = await util.callRead(request, path, {
    accept: "application/json",
  });
  expect(response.body).toBeDefined();
  expect(response.body.d.results.length > 0).toEqual(true);
};

const expectRejectProtocol = async (request, path) => {
  let response = await util.callRead(request, `${path}/$metadata`, {
    accept: "application/json",
  });
  expect(response.body).toBeDefined();
  expect(response.text).toEqual("Invalid service protocol. Only OData services supported");

  response = await util.callRead(request, `${path}/Header`, {
    accept: "application/json",
  });
  expect(response.body).toBeDefined();
  expect(response.text).toEqual("Invalid service protocol. Only OData services supported");
};

const describe = cds.version >= "7" ? global.describe : global.xdescribe;

describe("CDS 7 protocols", () => {
  beforeAll(async () => {
    await global._init;
    request = supertest(cds.app.server);
  });

  it("service with relative path", () => expectGET(request, "/odata/v2/relative"));

  it("service with absolute path", () => expectGET(request, "/absolute"));

  it("service with relative complex path", () => expectGETService(request, "/odata/v2/relative/complex/path"));

  it("service with absolute complex path", () => expectGET(request, "/absolute/complex/path"));

  it("service annotated with @odata", async () => expectGET(request, "/odata/v2/atodata"));

  it("reject service annotated with @rest", async () => expectRejectProtocol(request, '/odata/v2/atrest'));

  it("service annotated with @protocol: 'odata'", async () => expectGET(request, '/odata/v2/atprotocolodata'));

  it("service annotated with @protocol: 'rest'", async () => expectRejectProtocol(request, '/odata/v2/atprotocolrest'));

  it("service annotated with @protocol: ['odata']", async () => expectGET(request, '/odata/v2/atprotocollistodata'));

  it("service annotated with @protocol: ['rest']", async () => expectRejectProtocol(request, '/odata/v2/atprotocollistrest'));

  it("service annotated with @protocol: [{ kind: 'odata', path: 'relative2' }]", async () => expectGET(request, '/odata/v2/relative2'));

  it("service annotated with @protocol: [{ kind: 'odata', path: '/absolute2' }]", async () => expectGET(request, '/absolute2'));
});