package com.mnm.copypastabackend.api;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.unit.DataSize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/info")
@Api(value = "Endpoint for getting general information about the app")
public class InfoEndpoint {

    @Value("${spring.servlet.multipart.max-request-size}") String maxRequestSize;
    @Value("${spring.servlet.multipart.max-file-size}") String maxFileSize;

    @GetMapping("maxSizeBytes")
    @ApiOperation("Get the maximal number of megabytes the upload of a single picture cannot exceed")
    @ApiResponses(value = { @ApiResponse(code = 200, message = "Size of a picture in MB") })
    public ResponseEntity<Long> getMaxSizeBytes() {
        long maxRequestSizeBytes = DataSize.parse(maxRequestSize).toBytes();
        long maxFileSizeBytes = DataSize.parse(maxFileSize).toBytes();

        if (maxRequestSizeBytes <= maxFileSizeBytes) {
            return new ResponseEntity<>(maxRequestSizeBytes, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(maxFileSizeBytes, HttpStatus.OK);
        }
    }
}
