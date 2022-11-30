package com.mnm.copypastabackend.api;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URLConnection;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

import javax.servlet.http.HttpServletResponse;

import com.mnm.copypastabackend.entities.Pic;
import com.mnm.copypastabackend.repositories.PicRepository;
import com.mnm.copypastabackend.services.StorageService;
import io.swagger.annotations.Api;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/pictures")
@Api(value = "Endpoint for interacting with pictures")
public class PictureEndpoint {

    @Autowired
    private PicRepository picRepository;
    @Autowired
    private StorageService storageService;

    @GetMapping("/{id}")
    public void getPicture(@PathVariable("id") Long id, HttpServletResponse response){
        Optional<Pic> picOptional = picRepository.findById(id);

        if (picOptional.isEmpty()) {
            response.setStatus(404);
            return;
        }

        Pic pic = picOptional.get();

        response.setStatus(200);
        response.setContentType(URLConnection.guessContentTypeFromName(pic.getName()));
        response.setHeader("Content-Disposition", "attachment; filename=\"" + pic.getName() + "\"");
        response.setHeader("Cache-Control", CacheControl.maxAge(365, TimeUnit.DAYS).getHeaderValue());

        try (OutputStream outputStream = response.getOutputStream(); InputStream inputStream = storageService.readFileToStream(pic.getInternalUUID())){
            IOUtils.copy(inputStream, outputStream);
        } catch (IOException e) {
            response.setStatus(500);
            return;
        }
    }
}
