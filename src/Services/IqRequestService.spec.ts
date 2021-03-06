/*
 * Copyright 2019-Present Sonatype Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import expect, { applicationInternalIdResponse } from '../Tests/TestHelper';
import { Coordinates } from '../Types/Coordinates';
import nock from 'nock';
import { IqRequestService } from './IqRequestService';

describe('IQRequestService', () => {
  it("should have it's third party API request rejected when the IQ Server is down", async () => {
    const internalId = '123456';
    const stage = 'build';
    nock('http://testlocation:8070')
      .post(`/api/v2/scan/applications/${internalId}/sources/auditjs?stageId=${stage}`)
      .replyWithError('you messed up!')
      .get(`/api/v2/applications?publicId=testapp`)
      .reply(404, applicationInternalIdResponse.body);

    const requestService = new IqRequestService('admin', 'admin123', 'http://testlocation:8070', 'testapp', stage, 300);
    const coords = [new Coordinates('commander', '2.12.2', '@types')];

    return expect(requestService.submitToThirdPartyAPI(coords)).to.eventually.be.rejected;
  });

  it('should respond with an error if the response for an ID is bad', async () => {
    const stage = 'build';

    nock('http://testlocation:8070')
      .get(`/api/v2/applications?publicId=testapp`)
      .reply(applicationInternalIdResponse.statusCode, { thereisnoid: 'none' });

    const requestService = new IqRequestService('admin', 'admin123', 'http://testlocation:8070', 'testapp', stage, 300);
    const coords = [new Coordinates('commander', '2.12.2', '@types')];

    return expect(requestService.submitToThirdPartyAPI(coords)).to.eventually.be.rejectedWith(
      'No valid ID on response from Nexus IQ, potentially check the public application ID you are using',
    );
  });

  it("should have it's third party API request accepted when the IQ Server is up", async () => {
    const internalId = '4bb67dcfc86344e3a483832f8c496419';
    const stage = 'build';
    const response = {
      statusCode: 202,
      body: {
        statusUrl: 'api/v2/scan/applications/a20bc16e83944595a94c2e36c1cd228e/status/9cee2b6366fc4d328edc318eae46b2cb',
      },
    };

    nock('http://testlocation:8070')
      .post(`/api/v2/scan/applications/${internalId}/sources/auditjs?stageId=${stage}`)
      .reply(response.statusCode, response.body)
      .get(`/api/v2/applications?publicId=testapp`)
      .reply(applicationInternalIdResponse.statusCode, applicationInternalIdResponse.body);

    const requestService = new IqRequestService('admin', 'admin123', 'http://testlocation:8070', 'testapp', stage, 300);
    const coords = [new Coordinates('commander', '2.12.2', '@types')];

    return expect(requestService.submitToThirdPartyAPI(coords)).to.eventually.equal(
      'api/v2/scan/applications/a20bc16e83944595a94c2e36c1cd228e/status/9cee2b6366fc4d328edc318eae46b2cb',
    );
  });

  it("should have it's third party API request rejected when IQ Server is up but API gives bad response", async () => {
    const internalId = '4bb67dcfc86344e3a483832f8c496419';
    const stage = 'build';
    const response = {
      statusCode: 202,
      body: {
        statusUrl: 'api/v2/scan/applications/a20bc16e83944595a94c2e36c1cd228e/status/9cee2b6366fc4d328edc318eae46b2cb',
      },
    };

    nock('http://testlocation:8070')
      .post(`/api/v2/scan/applications/${internalId}/sources/auditjs?stageId=${stage}`)
      .reply(404, response.body)
      .get(`/api/v2/applications?publicId=testapp`)
      .reply(applicationInternalIdResponse.statusCode, applicationInternalIdResponse.body);

    const requestService = new IqRequestService('admin', 'admin123', 'http://testlocation:8070', 'testapp', stage, 300);
    const coords = [new Coordinates('commander', '2.12.2', '@types')];

    return expect(requestService.submitToThirdPartyAPI(coords)).to.eventually.be.rejectedWith(
      'Unable to submit to Third Party API',
    );
  });

  it('should have return a proper result when polling IQ Server and the request is eventually valid', async () => {
    const response = {
      statusCode: 200,
      body: {
        policyAction: 'None',
        reportHtmlUrl: 'http://localhost:8070/ui/links/application/test-app/report/95c4c14e',
        isError: false,
      },
    };

    const stage = 'build';
    nock('http://testlocation:8070')
      .get(`/api/v2/scan/applications/a20bc16e83944595a94c2e36c1cd228e/status/9cee2b6366fc4d328edc318eae46b2cb`)
      .reply(response.statusCode, response.body);

    const requestService = new IqRequestService('admin', 'admin123', 'http://testlocation:8070', 'testapp', stage, 300);

    requestService.asyncPollForResults(
      'api/v2/scan/applications/a20bc16e83944595a94c2e36c1cd228e/status/9cee2b6366fc4d328edc318eae46b2cb',
      () => {
        return false;
      },
      (x) => {
        return expect(x.reportHtmlUrl).to.equal('http://localhost:8070/ui/links/application/test-app/report/95c4c14e');
      },
    );
  });
});
