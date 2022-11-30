package com.mnm.copypastabackend.services;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import javax.annotation.PostConstruct;

import com.amazonaws.auth.AWSCredentials;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;
import com.amazonaws.services.s3.model.ObjectMetadata;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class StorageService {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(StorageService.class);

    @Value("${storage.picPath}")
    private String picPath;

    @Value("${storage.useAwsS3}")
    private boolean useAwsS3;

    private AmazonS3 s3client;

    @Value("${storage.amazonProperties.region}")
    private String region;
    @Value("${storage.amazonProperties.bucketName}")
    private String bucketName;
    @Value("${storage.amazonProperties.accessKey}")
    private String accessKey;
    @Value("${storage.amazonProperties.secretKey}")
    private String secretKey;

    @PostConstruct
    public void createPicDirectory() {
        if (useAwsS3) {
            AWSCredentials credentials = new BasicAWSCredentials(this.accessKey, this.secretKey);
            AWSStaticCredentialsProvider provider = new
                    AWSStaticCredentialsProvider(credentials);
            String endpointUrl = "s3." + region + ".backblazeb2.com";
            AwsClientBuilder.EndpointConfiguration endpointConfiguration =
                    new AwsClientBuilder.EndpointConfiguration(endpointUrl, region);
            s3client = AmazonS3ClientBuilder.standard().withCredentials(provider).withEndpointConfiguration(endpointConfiguration).withPathStyleAccessEnabled(true).build();
        } else {
            File directory = new File(picPath);
            if (!directory.exists()) {
                if(directory.mkdirs()) {
                    logger.info("Picture directory '{}' did not exist yet - created it", picPath);
                } else {
                    logger.error("Picture directory '{}' did not exist yet - could not create it!", picPath);
                }
            } else {
                logger.info("Picture directory '{}' was already present", picPath);
            }
        }
    }

    public String storeFile(InputStream inputStream, long size) throws IOException {
        String internalName = UUID.randomUUID().toString();
        if (useAwsS3) {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(size);
            s3client.putObject(bucketName, internalName, inputStream, metadata);
            logger.debug("Successfully stored file '{}' from inputstream on AWS S3 bucket", internalName);
        } else {
            Path destination = Paths.get(picPath, internalName);

            Files.copy(inputStream, destination);
            logger.debug("Successfully stored file '{}' from inputstream on local file system", internalName);
        }

        return internalName;
    }

    public void deleteFile(String internalUUID) throws IOException {
        if (useAwsS3) {
            s3client.deleteObject(bucketName, internalUUID);
            logger.debug("Successfully deleted file '{}' from AWS S3 bucket", internalUUID);
        } else {
            Path pathToDelete = Paths.get(picPath, internalUUID);
            Files.deleteIfExists(pathToDelete);
            logger.debug("Successfully deleted file '{}' from local file system", internalUUID);
        }

    }

    public InputStream readFileToStream(String internalUUID) throws FileNotFoundException {
        if (useAwsS3) {
            return s3client.getObject(bucketName, internalUUID).getObjectContent();
        } else {
            return new FileInputStream(Paths.get(picPath, internalUUID).toFile());
        }

    }
}
