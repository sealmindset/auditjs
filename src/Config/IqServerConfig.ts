/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Config } from "./Config";
import { readFileSync } from "fs";
import { Logger } from "winston";
import { getAppLogger } from "../Application/Logger/Logger";

export class IqServerConfig extends Config {
  constructor(
    protected username: string = '', 
    protected token: string = '', 
    private host: string = '', 
    readonly logger: Logger = getAppLogger())
  {
    super(username, token, logger);
  }

  public saveFile(stringToSave: string = this.getStringToSave()): boolean {
    return super.saveConfigToFile(stringToSave, '.iq-server-config');
  }

  public getUsername(): string {
    return this.username;
  }

  public getToken(): string {
    return this.token;
  }

  public getHost(): string {
    return this.host;
  }
  
  public getConfigFromFile(
    saveLocation: string = this.getSaveLocation('.iq-server-config')
  ): IqServerConfig {
    let fileString = readFileSync(saveLocation, 'utf8');
    let splitString = fileString.split('\n');
    super.username = splitString[0].split(':')[1].trim();
    super.token = splitString[1].split(':')[1].trim();
    let temp = splitString[2].split(':');
    this.host = temp.slice(1).join(':').trim();

    return this;
  }

  public getStringToSave(): string {
    return `Username: ${this.username}\nPassword: ${this.token}\nHost: ${this.host}\n`;
  }
}