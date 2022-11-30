package com.mnm.copypastabackend;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import io.swagger.models.Swagger;
import springfox.documentation.spring.web.json.JacksonModuleRegistrar;
import springfox.documentation.spring.web.json.Json;
import springfox.documentation.spring.web.json.JsonSerializer;

@Component
@Primary
public class CustomBasePathJsonSerializer extends JsonSerializer {

    @Value("${web-security.backend-url}")
    private String backendUrl;

    public static String basePath = "/api";

    public CustomBasePathJsonSerializer(List<JacksonModuleRegistrar> modules) {
        super(modules);
    }

    @Override
    public Json toJson(Object toSerialize) {
        if (toSerialize instanceof Swagger) {
            Swagger swagger = (Swagger) toSerialize;
            if (backendUrl != null) {
                swagger.host(backendUrl);
                swagger.basePath(basePath);
            } else {
                swagger.basePath("/");
            }
        }
        return super.toJson(toSerialize);
    }

}
